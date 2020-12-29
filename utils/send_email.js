var Transporter = require('../config/mail');
var keys = require('../config/keys');

class sendEmail {
    constructor(reciever, type, token) {
        this.reciever = reciever;
        this.type = type;
        this.token = token
    }

    email() {
        return new Promise((resolve, reject) => {
            var emailContent = require(`../emailTemplate/${this.type}`)
            var response = {};
            var mailOpts = {
                from: keys.mailer.user,
                to: this.reciever.email,
                subject: emailContent.subject,
                text: `${emailContent.body}`+ this.reciever.email + `/` + this.token
            };
            Transporter.sendMail(mailOpts, function (error, info) {
                if (error) {
                    response.error = error;
                    return new sendEmail().failureHandler(response, reject);
                }
                else {
                    response.result = 'Success';
                    response.code = 201;
                    return resolve(response)
                }
            });
        })
    }

    emailActivated() {
        return new Promise((resolve, reject) => {
            var emailContent = require(`../emailTemplate/${this.type}`)
            var response = {};
            var mailOpts = {
                from: keys.mailer.user,
                to: this.reciever.email,
                subject: emailContent.subject,
                text: `${emailContent.body}`
            };
            Transporter.sendMail(mailOpts, function (error, info) {
                if (error) {
                    response.error = error;
                    return new sendEmail().failureHandler(response, reject);
                }
                else {
                    response.result = 'Success';
                    response.code = 201;
                    return resolve(response)
                }
            });
        })
    }

    emailNewBooking(){
        return new Promise((resolve, reject) => {
            var emailContent = require(`../emailTemplate/${this.type}`)
            var body = emailContent.body.toString();
            body = body.replace('$first_name',this.reciever.name);
            body = body.replace('$date',this.token.date);
            body = body.replace('$start_time',this.token.start_time);
            body = body.replace('$end_time',this.token.end_time);
            body = body.replace('$court_name',this.token.court);
            body = body.replace('$type',this.token.type);
            body = body.replace('$amount',this.token.court_price);
            body = body.replace('$wallet',this.token.amount);
            body = body.replace('$player',this.token.players);
            var response = {};
            var mailOpts = {
                from: keys.mailer.user,
                to: this.reciever.email,
                subject:  emailContent.subject,
                text: body
            };
            Transporter.sendMail(mailOpts, function (error, info) {
                if (error) {
                    response.error = error;
                    return new sendEmail().failureHandler(response, reject);
                }
                else {
                    response.result = 'Success';
                    response.code = 201;
                    return resolve(response)
                }
            });
        })
    }
    
    

    failureHandler(response, reject) {
        response.responseTimestamp = new Date();
        response.result = 'Failed';
        return reject(response);

    }

}

module.exports = sendEmail;