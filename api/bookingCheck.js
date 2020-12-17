class bookingCheck {
    checkPlayerAvailable(booking,userId){
        for (let i = 0; i < booking.players.length; i++)
        {
            if (booking.players[i].user == userId)
            return true;
        }
        return false;
    }
}

module.exports = new bookingCheck();