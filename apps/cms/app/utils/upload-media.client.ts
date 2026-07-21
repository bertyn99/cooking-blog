/** Client-side upload to `POST /api/media` (already compressed when using prepareImageForUpload). */
export async function uploadMediaFile(file: File): Promise<string> {
  const { $api } = useNuxtApp()
  const formData = new FormData()
  formData.append('file', file)
  const uploaded = await $api<{ pathname: string }>('/api/media', {
    method: 'POST',
    body: formData,
  })
  return uploaded.pathname
}
