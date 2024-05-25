export default (input) => 
  input.map(line => {
    var rPart = line.trimLeft()

    return {
      l: line.replace(rPart, ''),
      r: rPart
    }
  })