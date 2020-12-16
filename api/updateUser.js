const mongoQuery = require('../mongoQuery/query2mongo');
const message = require('../utils/enum');
const randtoken = require('rand-token');

class UpdateUser {
    resetPassword(email, password,token) {
        var response = {};
        return new Promise((resolve, reject) => {
            var mongoD = new mongoQuery();
            var query = { 'email': email }
            mongoD.findOne('User', query, (err, result, data) => {
                if (err) {
                    //return err in failure handler
                    response.error = err;
                    response.code = 500;
                    response.message = message.SERVER_ERROR;
                    return this.failureHandler(response, reject)
                }
                if (result) {
                    if (data.vcode == token) {
                        return this.updatePassword(email, password, response, resolve);
                    } else {
                        //return err in failure handler
                        response.error = null;
                        response.code = 400;
                        response.message = message.VERIFICATION_LINK_FAILED
                        return this.failureHandler(response, reject)
                    }
                } else {
                    //return err in failure handler
                    response.error = null;
                    response.code = 400;
                    response.message = message.USER_NOT_FOUND_ERROR
                    return this.failureHandler(response, reject)
                }
            })
        })
    }
    updatePassword(email, password, response, resolve) {
        
        var tmpToken = randtoken.generate(30);
        var mongoD = new mongoQuery();
        var query = { 'email': email };
        var update = { 'password': password, 'vcode': tmpToken }
        mongoD.updateOne('User', query, update, true, false, null, (err, result, data) => {
            if (err) {
                //return err in failure handler
                response.error = err;
                response.code = 400;
                response.message = message.SERVER_ERROR;
                return this.failureHandler(response, reject)
            }
            if(result) {
                response.result = 'Success'
                response.code = 200;
                response.message = message.RESET_PASSWORD_SUCCESSFULL;

                return resolve(response)
            }
        })
    }

    failureHandler(response, reject) {
        response.responseTimestamp = new Date();
        response.result = 'Failed';
        return reject(response);
    }
}

module.exports = new UpdateUser();