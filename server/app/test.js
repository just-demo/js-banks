// npx babel-node test.js
import express from 'express';

express()
    .get('/', (req, res) => setTimeout(() => res.send('Test!'),1000))
    .listen(3333, () => console.log('Started!'));
