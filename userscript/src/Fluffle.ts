export function getFluffleData(blob: Blob): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('limit', '32');
    formData.append('file', blob, 'image.png');

    GM.xmlHttpRequest({
      method: 'POST',
      url: 'https://api.fluffle.xyz/exact-search-by-file',
      headers: {
        'User-Agent': "Fluffle621/main (by 'tarrgon.' on Discord)",
        'Accept': 'application/json'
      },
      onload: function (response) {
        try {
          resolve(JSON.parse(response.responseText));
        } catch (e) {
          reject(e);
        }
      },
      onerror: function (e) {
        reject(e);
      },
      data: formData,
      fetch: true
    });
  });
}