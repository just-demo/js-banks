import React from "react";
import Done from '@material-ui/icons/Done'
import Clear from '@material-ui/icons/Clear'

function ActiveIndicator(props) {
    return props.value? <Done style={{color: 'green', fontSize: 16}}/> : <Clear style={{color: 'red', fontSize: 16}}/>
}

export default ActiveIndicator;