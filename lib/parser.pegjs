//  Copyright(C) 2016 Alexander Walters
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.If not, see <http://www.gnu.org/licenses/>.

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
