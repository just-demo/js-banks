// npx babel-node main.js
// Node.js configuration -> Node interpreter -> .../node_modules/.bin/babel-node
import files from './files';
import Source from './data-source/source';
import Audit from "./data-source/audit";
// import urls from './urls'
// import pdfs from './pdfs'

// urls.download('http://localhost:3333/download/nbu/not-banks/pdf/320779.pdf?url=https://bank.gov.ua/files/Licences_bank/320779.pdf')
//     .then(pdf => pdfs.parse(pdf))
//     .then(text => console.log(text));

const startTime = new Date();
const audit = new Audit();
const source = new Source(audit);
Promise.all([
    source.getBanks().then(banks => files.writeJson('../../public/banks.json', banks)),
    source.getRatings().then(ratings => files.writeJson('../../public/minfin-ratings.json', ratings))
]).then(() => console.log('Total time:', new Date() - startTime));
printProgress();

function printProgress() {
    if (audit.ready()) {
        const progress = audit.progress();
        const now = new Date().getTime();
        const total = progress.end - progress.start;
        const taken = now - progress.start;
        const left = progress.end - now;
        console.log('Progress (total/taken/left): ', Math.round(100 * taken / total) + '%', total, taken, left);
        if (left <= 0) {
            return;
        }
    } else {
        console.log('Estimating...');
    }
    setTimeout(printProgress, 100);
}
