import React from "react";

function ExternalLink(props) {
    const {url, title, style} = props;
    const host = url => (url.match(/\/\/([^/]+)/) || [])[1] || url;
    return <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={style}>{title || host(url)}</a>;
}

export default ExternalLink;