class timeCheck {
    rangeOverlappingCheck(ranges){
        console.log(ranges)
        for (let i = 0; i < ranges.Length; i++)
        {
             for (let j = i + 1; j < ranges.Length; j++)
             {
                 if (ranges[i].bstart_time <= ranges[j].bend_time && ranges[i].bend_time >= ranges[j].bstart_time)
                    return true;

             }
         }
        return false;
    }

    checkBookingOverlapforCourt(start_time,end_time,ranges){
        for (let i = 0; i < ranges.Length; i++)
        {
                 if (start_time <= ranges[i].end_time && end_time >= ranges[i].start_time)
                    return true;

         }
        return false;
    }
    dateFormate(dateform){
        var date = new Date(dateform);
        var dd = date.getDate();
        var mm = date.getMonth()+1; 
        var yyyy = date.getFullYear();
        if(dd<10){
            dd='0'+dd;
        } 
        if(mm<10){
            mm='0'+mm;
        } 
        date = yyyy+'-'+mm+'-'+dd;
        return date
    }
     checkBookingOverlapforBreak(start_time,end_time,ranges){
        for (let i = 0; i < ranges.Length; i++)
        {
                 if (start_time <= ranges[i].bend_time && end_time >= ranges[i].bstart_time)
                    return true;

         }
        return false;
    }
}
module.exports = new timeCheck();