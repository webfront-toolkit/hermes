
function format(docfile) {
  var fqnMap = {};
  var toplevel = [];
  var nextId = 0;

  docfile.javadoc.forEach(function(javadoc){
    var type = (javadoc.ctx && javadoc.ctx.type);
    var name = (javadoc.ctx && typeof javadoc.ctx.name === 'string') ? javadoc.ctx.name : '';
    var value = (javadoc.ctx? javadoc.ctx.value.replace(/(^[\s,;'"]*|[\s,;'"]*$)/g, ''): '');
    var description = javadoc.description;
    description.summary = description.summary.replace(/\n/g, '');

    var tagValues = {
      'deprecated': false,
    };
    var multiTagValues = {
      'summary-column': [],
      'see': [],
    };

    javadoc.tags.forEach(function(tag) {
      var value = tag.url || tag.local || tag.string;

      if (tag.type in multiTagValues) {
        multiTagValues[tag.type].push(value);
      } else {
        tagValues[tag.type] = value;
      }
    });

    multiTagValues['summary-column'] = multiTagValues['summary-column'].map(function(tag) {
      var spaceIndex = tag.indexOf(' ');
      return {
        key: spaceIndex !== -1? tag.substring(0, spaceIndex): tag,
        description: spaceIndex !== -1? tag.substring(spaceIndex + 1): tag,
        full: tag,
      };
    });

    var fqn = tagValues.fqn? tagValues.fqn: name;
    name = tagValues.name? tagValues.name: name

    javadoc.filename = docfile.filename;

    if (fqn in fqnMap) {
      var first = fqnMap[fqn].raw;
      var second = javadoc;

      throw 'Two elements of the same fully qualified name (fqn) found:\n'+
        ' 1. '+ first.filename +':'+ first.line +'\n'+
        ' 2. '+ second.filename +':'+ second.line;
    }

    fqnMap[fqn] = {
      commentId: nextId++,
      type: type,
      name: name,
      fqn: fqn,
      value: value,
      description: description,
      tags: tagValues,
      multiTags: multiTagValues,
      ignore: javadoc.ignore,
      raw: javadoc,

      // set after all elements are defined
      parent: null,
      children: [],
      parentElement: null,
    };
  });

  Object.keys(fqnMap).forEach(function(fqn){
    var comment = fqnMap[fqn];

    comment.parent = getParentByFqn(fqn);
    comment.children = getChildrenByFqn(fqn);
    comment.parentElement = fqnMap[comment.tags['parent-element']];

    if (!comment.parent) {
      toplevel.push(comment);
    }
  });

  Object.keys(fqnMap).forEach(function(fqn){
    var comment = fqnMap[fqn];
    comment.description.summary = interpolate(comment.description.summary);
    comment.description.body = interpolate(comment.description.body);
    comment.description.full = interpolate(comment.description.full);
  });

  var result = {};
  result.filename = docfile.filename;
  result.javadoc = toplevel;
  return result;

  function getParentByFqn(fqn) {
    var lastDotIndex = fqn.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      var parentFqn = fqn.substring(0, lastDotIndex);
      return fqnMap[fqn];
    } else {
      return null;
    }
  }a

  function getChildrenByFqn(fqn) {
    var level = (fqn !== ''? fqn.split('.').length: 0) + 1;

    return Object.keys(fqnMap)
      .filter(function(name) { return name.indexOf(fqn) === 0 && level === name.split('.').length; })
      .map(function(name) { return fqnMap[name]; })
      .sort(function(a, b) { return a.commentId > b.commentId; })
      ;
  }

  function interpolate(str) {
    var retVal = '';
    var i = 0;

    while (true) {
      var startIndex = str.indexOf('${', i);
      if (startIndex === -1) {
        retVal += str.substring(i);
        break;
      }

      retVal += str.substring(i, startIndex);
      var endIndex = str.indexOf('}', startIndex);
      if (endIndex === -1) {
        throw 'unclosed variable: "'+ str +'"';
      }

      var variable = str.substring(startIndex + 2, endIndex);
      var hashIndex = variable.indexOf('#');
      if (hashIndex === -1) {
        throw 'no hash found in variable: "'+ str +'"';
      }

      var fqn = variable.substring(0, hashIndex);
      var comment = fqnMap[fqn];
      if (!comment) {
        throw 'could not find element of fqn: '+ fqn;
      }

      var key = variable.substring(hashIndex + 1);
      retVal += comment[key];
      i = endIndex + 1;
    }
    return retVal
  }
};

module.exports = format;

