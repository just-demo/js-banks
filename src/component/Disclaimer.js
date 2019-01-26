import React from 'react';
import ExternalLink from "./ExternalLink";

function Disclaimer() {
    function getSites() {
        return [
            "https://www.bank.gov.ua",
            "http://www.fg.gov.ua",
            "https://www.minfin.com.ua"
        ]
            .map(url => <ExternalLink key={url} url={url}/>)
            .map((link, index) => index > 0 ? [<span key={index}>, </span>, link] : link)
    }

    return (
        <div style={{flexGrow: 1, backgroundColor: 'pink', fontSize: 13}}>
            Вся інформація зібрана з відкритих джерел: {getSites()}. Щодо політики копіювання і розміщення информації на інших сайтах звертайтесь до першоджерел.
        </div>
    );
}

export default Disclaimer;
