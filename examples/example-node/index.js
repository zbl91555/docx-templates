require('isomorphic-fetch');
const qrcode = require('yaqrcode');
const createReport = require('docx-templates').default;
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(process.argv[2]);

createReport({
  template,
  data: {},
  additionalJsContext: {
    tile: async (z, x, y, size = 3) => {
      const resp = await fetch(
        `http://tile.stamen.com/toner/${z}/${x}/${y}.png`
      );
      const buffer = resp.arrayBuffer
        ? await resp.arrayBuffer()
        : await resp.buffer();
      return { width: size, height: size, data: buffer, extension: '.png' };
    },
    qr: contents => {
      const dataUrl = qrcode(contents, { size: 500 });
      const data = dataUrl.slice('data:image/gif;base64,'.length);
      return {
        width: 6,
        height: 6,
        data,
        extension: '.gif',
        caption: 'QR Code caption',
      };
    },
    insertExcel: fileName => {
      return {
        data: fs.readFileSync(path.join(__dirname, fileName)),
        extension: '.xlsx',
        shapeImageData: fs.readFileSync(path.join(__dirname, 'sample.png')),
        shapeImageExtension: '.png',
      };
    },
  },
})
  .then(rendered =>
    fs.writeFileSync(process.argv.length > 3 ? process.argv[3] : null, rendered)
  )
  .catch(console.log);
