const fs = require('fs');
const path = './src/shared/data/global_assets.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.forEach(d => {
  if (['NVDAX', 'AAPLX', 'TSLAX', 'MSFTX', 'AMZNX'].includes(d.symbol)) {
    d.icon = `/assets_icons/${d.symbol}.webp`;
  }
});

fs.writeFileSync(path, JSON.stringify(data));
console.log('Updated to .webp');
