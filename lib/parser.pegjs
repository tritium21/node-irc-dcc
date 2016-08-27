expression = chat / passive_send_request / passive_send_accept / passive_resume / passive_accept / send / resume / accept
chat
 = "DCC CHAT chat " addr:integer " " port:integer
   {return {type: 'chat', addr:addr, port:port};}
passive_send_accept
 = "DCC SEND " filename:filename " " addr:integer " " port:integer " " length:integer " " token:integer
   {return {type: 'passive_send_accept', filename:filename, addr:addr, port:port, length:length, token:token};}
passive_send_request
 = "DCC SEND " filename:filename " " addr:integer " 0 " length:integer " " token:integer
   {return {type: 'passive_send_request', filename:filename, addr:addr, length:length, token:token};}
passive_resume
 = "DCC RESUME " filename:filename " 0 " position:integer " " token:integer
   {return {type: 'passive_resume', filename:filename, position:position, token:token};}
passive_accept
 = "DCC ACCEPT " filename:filename " 0 " position:integer " " token:integer
   {return {type: 'passive_accept', filename:filename, position:position, token:token};}
send
 = "DCC SEND " filename:filename " " addr:integer " " port:integer " " length:integer
   {return {type: 'send', filename:filename, addr:addr, port:port, length:length};}
resume
 = "DCC RESUME " filename:filename " " port:integer " " position:integer
   {return {type: 'resume', filename:filename, port:port, position:position};}
accept
 = "DCC ACCEPT " filename:filename " " port:integer " " position:integer
   {return {type: 'accept', filename:filename, port:port, position:position};}
filename
 = "\""? letters:[^ ]i+ "\""?
   {return letters.join("")}
integer "integer"
  = digits:[0-9]+
    {return parseInt(digits.join(""), 10);}
