const fs = require('fs');
const path = './src/shared/data/global_assets.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const newAssets = [
  {"symbol":"NVDAX","name":"NVIDIA Tokenized Stock","type":"Crypto","icon":"/assets_icons/NVDAX.png","description":"Tokenized crypto stock asset"},
  {"symbol":"AAPLX","name":"Apple Tokenized Stock","type":"Crypto","icon":"/assets_icons/AAPLX.png","description":"Tokenized crypto stock asset"},
  {"symbol":"TSLAX","name":"Tesla Tokenized Stock","type":"Crypto","icon":"/assets_icons/TSLAX.png","description":"Tokenized crypto stock asset"},
  {"symbol":"MSFTX","name":"Microsoft Tokenized Stock","type":"Crypto","icon":"/assets_icons/MSFTX.png","description":"Tokenized crypto stock asset"},
  {"symbol":"AMZNX","name":"Amazon Tokenized Stock","type":"Crypto","icon":"/assets_icons/AMZNX.png","description":"Tokenized crypto stock asset"}
];

data.unshift(...newAssets);

fs.writeFileSync(path, JSON.stringify(data));
console.log('Added tokenized crypto stocks to global_assets.json');
