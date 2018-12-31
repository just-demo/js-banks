// npx babel-node main.js
import files from './files';
import Source from './data-source/source';
// import urls from './urls'
// import pdfs from './pdfs'

// urls.download('http://localhost:3333/download/nbu/not-banks/pdf/320779.pdf?url=https://bank.gov.ua/files/Licences_bank/320779.pdf')
//     .then(pdf => pdfs.parse(pdf))
//     .then(text => console.log(text));

const startTime = new Date();
const source = new Source();
Promise.all([
    source.getBanks().then(banks => files.writeJson('../../public/banks.json', banks)),
    source.getRatings().then(ratings => files.writeJson('../../public/minfin-ratings.json', ratings))
]).then(() => console.log('Total time:', new Date() - startTime));