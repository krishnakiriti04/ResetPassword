async function resetpassword() {
    document.getElementById('divemail').style.display = "none";
    document.getElementById('codediv').style.display = "block";
    document.getElementById('newpassworddiv').style.display = "none";
    document.getElementById('submitcode').style.display = "block";
    document.getElementById('setnewpassword').style.display = "none";
    document.getElementById('sendmail').style.display = "none";
    let macthingkey = generateRandomString();

    let data = {
        email: document.getElementById('confirmemail').value,
        keytomail: macthingkey
    };

    try {
        let email = await fetch("http://localhost:4000/sendemail", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                'Content-Type': "application/json"
            }
        })
        if (email.status === 200) {
            alert("Mail Sent!!");
        } else {
            alert("Couldn't send mail!!");
            window.location.href = "http://localhost:4000/"
        }
    } catch (err) {
        console.log("mail function  :", err);
    }
}

async function codecheck() {
    let data = {
        code: document.getElementById('key').value
    }

    let fetchdata = fetch('http://localhost:4000/code', {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if (res.status == 200) {
                document.getElementById('divemail').style.display = "none";
                document.getElementById('codediv').style.display = "none";
                document.getElementById('newpassworddiv').style.display = "block";
                document.getElementById('submitcode').style.display = "none";
                document.getElementById('setnewpassword').style.display = "block";
                document.getElementById('sendmail').style.display = "none";
                alert("Verification Successful")
            } else {
                alert("Verification Unsuccessful")
            }
        })
        .catch(err => console.log("Verification function : ", err))
}

async function changepassword() {
    let newpassword = document.getElementById('newpassword').value;
    let email = document.getElementById('newpwdemail').value;
    let data = {
        "email": email,
        'password': newpassword
    }
    fetch('http://localhost:4000/resetpassword', {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': "application/json"
        }
    }).then(res => {
        if (res.status == 200) {
            alert("Password updated!!");
            window.location.href = "http://localhost:4000/"
        } else {
            alert("Password updation failed");
        }

    })
}

function generateRandomString() {
    let str = Math.random().toString(36).substring(7);
    return str;
}

window.onload = () => {
    document.getElementById('loginDiv').style.display = "block";
    document.getElementById('registerDiv').style.display = "none";
    document.getElementById('resetDiv').style.display = "none";
}