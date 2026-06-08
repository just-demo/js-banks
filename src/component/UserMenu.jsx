import React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Person from '@material-ui/icons/Person'

function UserMenu(props) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [userSelected, setUserSelected] = React.useState(props.selected);
    const users = ['Користувач', 'Розробник'];

    function handleClick(event) {
        setAnchorEl(event.currentTarget);
    }

    function handleClose() {
        setAnchorEl(null);
    }

    function handleSelect(index) {
        setUserSelected(index);
        handleClose();
        props.onSelect(index);
    }

    return (
        <div>
            <Button
                color="inherit"
                aria-owns={anchorEl ? 'simple-menu' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <Person style={{marginTop: -3}}/>{users[userSelected]}
            </Button>
            <Menu id="simple-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                {users.map((user, index) => (
                    <MenuItem key={index} onClick={() => handleSelect(index)} style={{
                        fontSize: 14,
                        textTransform: 'uppercase'
                    }}>{user}</MenuItem>
                ))}
            </Menu>
        </div>
    );
}

export default UserMenu;