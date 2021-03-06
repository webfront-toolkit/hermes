/*

   Copyright 2015 Maciej Chałapuk

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/
'use strict';

// polyfills must not use full offensivejs library
// (it would be loaded in the browser twice otherwise)
var nodsl = require('offensive/NoDsl').default;

module.exports = Object.values || polyfill;

function polyfill(object) {
  nodsl.check(typeof object !== 'undefined' && object !== null,
      'object must be not empty; got ', object);

  var values = [];
  for (var key in object) {
    values.push(object[key]);
  }
  return values;
}

