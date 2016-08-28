expression = chat / send / resume / accept
chat
 = "DCC CHAT chat " long:integer " " port:integer
   {return {type: 'chat', long:long, port:port};}
send
 = "DCC SEND " filename:filename " " long:integer " " port:integer " " length:integer
   {return {type: 'send', filename:filename, long:long, port:port, length:length};}
resume
 = "DCC RESUME " filename:filename " " port:integer " " position:integer
   {return {type: 'resume', filename:filename, port:port, position:position};}
accept
 = "DCC ACCEPT " filename:filename " " port:integer " " position:integer
   {return {type: 'accept', filename:filename, port:port, position:position};}
filename
 = mirc / correct
mirc
 = "\"" letters:[^"]i+ "\""
   {return letters.join("")}
correct
 = letters:[^ ]i+
   {return letters.join("")}
integer "integer"
  = digits:[0-9]+
    {return parseInt(digits.join(""), 10);}
