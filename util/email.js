const nodemailer = require('nodemailer');

const sendEmail = async (option) => {

    var transport = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "e5f55cf49158ed",
            pass: "7e18f7cc6c612d"
        }
    });

    const mailOption = {
        from: 'mohammadhg98@gmail.com',
        to: option.userEmail,
        subject: option.subject,
        html: option.html
    }


    await transport.sendMail(mailOption);

};

module.exports = sendEmail;