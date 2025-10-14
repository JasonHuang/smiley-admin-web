import { useEffect, useRef, useState } from 'react';
import { Button, MessagePlugin } from 'tdesign-react';
import { app, ensureLogin } from '../services/cloudbase';

type Props = {
  value?: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
  max?: number; // 可选最大数量限制
};

// 通用多图上传组件：
// - 支持多选上传，第一张图即主图
// - 未上传时显示一个“+”按钮；编辑态显示图片列表，每张右上角可删除
// - 组件内部把 cloud://fileID 转成临时 URL 用于预览，不改变传出的 value
export default function ImageUploader({ value = [], onChange, disabled, max }: Props) {
  const [list, setList] = useState<string[]>(Array.isArray(value) ? value : []);
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setList(Array.isArray(value) ? value : []);
  }, [value]);

  // 将 cloud://fileID 转为临时 URL 以供预览
  useEffect(() => {
    const ids = (list || []).filter((s) => typeof s === 'string' && s.startsWith('cloud://'));
    if (ids.length === 0) return;
    (async () => {
      try {
        const temp: any = await app.getTempFileURL({ fileList: ids });
        const map: Record<string, string> = {};
        (temp?.fileList || []).forEach((f: any) => { if (f?.fileID && f?.tempFileURL) map[f.fileID] = f.tempFileURL; });
        setUrlMap((prev) => ({ ...prev, ...map }));
      } catch (e) {
        // 忽略失败，保持原值
      }
    })();
  }, [list]);

  function makeCloudPath(file: File) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const rand = Math.random().toString(36).slice(2);
    return `products/${Date.now()}_${rand}.${ext}`;
  }

  async function handleUpload(files: FileList | File[]) {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    if (typeof max === 'number' && max > 0) {
      const remain = Math.max(0, max - list.length);
      if (remain <= 0) {
        MessagePlugin.warning(`最多上传 ${max} 张图片`);
        return;
      }
    }
    // 将宽>高的图片，以上下高度为基准居中裁切成正方形再上传
    function loadImageFromFile(file: File): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });
    }

    async function cropIfWideSquare(file: File): Promise<Blob | File> {
      try {
        const img = await loadImageFromFile(file);
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        // 当宽或高不相等时，按较小边居中裁切为正方形
        if (width !== height && width > 0 && height > 0) {
          const size = Math.min(width, height);
          const sx = Math.floor((width - size) / 2);
          const sy = Math.floor((height - size) / 2);
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return file;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
          const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
          const quality = mime === 'image/jpeg' ? 0.92 : undefined;
          const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, quality as any));
          return blob || file;
        }
        return file;
      } catch {
        // 解析或裁切失败时直接上传原文件
        return file;
      }
    }

    try {
      setUploading(true);
      await ensureLogin();
      const ids: string[] = [];
      for (const file of arr) {
        const cloudPath = makeCloudPath(file);
        console.info('[Upload] start', { cloudPath, name: file.name, type: file.type, size: file.size });
        console.info('[Upload] file instanceof', { File: file instanceof File, Blob: file instanceof Blob, toString: Object.prototype.toString.call(file) });
        const useStorage = typeof (app as any).storage === 'function';
        console.info('[Upload] method', useStorage ? 'storage.uploadFile' : 'uploadFile');
        const res: any = useStorage
          ? await (app as any).storage().uploadFile({ cloudPath, file })
          : await (app as any).uploadFile({ cloudPath, file });
        console.info('[Upload] response', res);
        const fileID: string = res?.fileID || res?.fileId || '';
        if (fileID) ids.push(fileID);
      }
      if (ids.length === 0) throw new Error('未获取到文件ID');
      const next = [...list, ...ids];
      setList(next);
      onChange?.(next);
      // 获取新增图片的临时 URL 供预览
      try {
        const temp: any = await app.getTempFileURL({ fileList: ids });
        const map: Record<string, string> = {};
        (temp?.fileList || []).forEach((f: any) => { if (f?.fileID && f?.tempFileURL) map[f.fileID] = f.tempFileURL; });
        if (Object.keys(map).length > 0) setUrlMap((prev) => ({ ...prev, ...map }));
      } catch {}
      MessagePlugin.success('图片上传成功');
    } catch (e: any) {
      console.error('[Upload] failed', e);
      MessagePlugin.error(e?.message || '图片上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAt(idx: number) {
    const next = list.filter((_, i) => i !== idx);
    setList(next);
    onChange?.(next);
  }

  const canAddMore = !disabled && (typeof max !== 'number' || max <= 0 || list.length < max);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(list || []).map((raw, idx) => {
          const src = typeof raw === 'string' && raw.startsWith('cloud://') ? (urlMap[raw] || '') : raw;
          return (
            <div
              key={`${raw}-${idx}`}
              draggable={!disabled && !uploading}
              onDragStart={() => { dragIndexRef.current = idx; }}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
              onDragLeave={() => { setDragOverIndex((v) => (v === idx ? null : v)); }}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragIndexRef.current;
                const to = idx;
                setDragOverIndex(null);
                dragIndexRef.current = null;
                if (from == null || to == null || from === to) return;
                const next = [...list];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                setList(next);
                onChange?.(next);
              }}
              title="拖动以调整顺序"
              style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--td-border-level-1-color)', cursor: (!disabled && !uploading) ? 'grab' : 'default', boxShadow: dragOverIndex === idx ? '0 0 0 2px var(--td-brand-color-light)' : 'none' }}
            >
              {src ? (
                <img src={src} alt={`img-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--td-text-color-secondary)' }}>无预览</div>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: 12, width: 24, height: 24, cursor: 'pointer' }}
                aria-label="删除图片"
              >×</button>
              {idx === 0 && (
                <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, padding: '2px 6px', borderRadius: 6 }}>主图</div>
              )}
            </div>
          );
        })}

        {canAddMore && (
          <label style={{ display: 'grid', placeItems: 'center', width: 72, height: 72, borderRadius: 8, border: '1px dashed var(--td-border-level-1-color)', color: 'var(--td-text-color-secondary)', cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>+</div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={disabled || uploading}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) handleUpload(files);
              }}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>
      {(list.length > 0) && (
        <div style={{ marginTop: 6, color: 'var(--td-text-color-secondary)', fontSize: 12 }}>
          第一张图片为主图，可通过拖动调整顺序
        </div>
      )}
      <div style={{ marginTop: 6, color: 'var(--td-text-color-secondary)', fontSize: 12 }}>
        图片将按原始比例上传（服务器端进行裁切）
      </div>
      <div style={{ marginTop: 8 }}>
        <Button variant="outline" size="small" disabled={disabled || uploading} onClick={() => { setList([]); onChange?.([]); }}>清除全部</Button>
      </div>
    </div>
  );
}