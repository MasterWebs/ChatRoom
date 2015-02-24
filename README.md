# ChatRoom
Second programming assignment in WEPO II

### To install and run the application
* Type 'npm install' in command prompt
* Type 'bower install' in command prompt
* Type 'node chatserver.js' in command prompt
* Type 'python -m http.server \<port-number\>' in command prompt (where \<port-number\> is your desired port number i.e. 8000, just not 8080)
  + If you have python 2 then just type python -m SimpleHTTPServer \<port-number\>

### Modifications to chatserver.js
* Op function was changed so that any user can be opped
  + This was done so that a non-empty room always has an op
* When a new room is added, the roomlist event is emitted so that the roomlist updates in real time
