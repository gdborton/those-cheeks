export default function getCharacterFromRemainders(leftRemainder, rightRemainder, lineNumber) {
  if (leftRemainder > 3 / 4) {
    if (rightRemainder > 3 / 4) {
      return "⣿";
    } else if (rightRemainder > 1 / 2) {
      return '⣷';
    } else if(rightRemainder > 1 / 4) {
      return '⣧';
    } else if (rightRemainder >= 0 || lineNumber === 0) {
      return '⣇';
    } else {
      return '⡇';
    }
  } else if (leftRemainder > 1 / 2) {
    // ⣾, ⣶, ⣦, ⣆
    if (rightRemainder > 3 / 4) {
      return "⣾";
    } else if (rightRemainder > 1 / 2) {
      return '⣶';
    } else if(rightRemainder > 1 / 4) {
      return '⣦';
    } else if (rightRemainder >= 0 || lineNumber === 0) {
      return '⣆';
    } else {
      return '⡆';
    }
  } else if (leftRemainder > 1 / 4) {
    // ⣼, ⣴, ⣤, ⣄
    if (rightRemainder > 3 / 4) {
      return "⣼";
    } else if (rightRemainder > 1 / 2) {
      return '⣴';
    } else if(rightRemainder > 1 / 4) {
      return '⣤';
    } else if (rightRemainder >= 0 || lineNumber === 0) {
      return '⣄';
    } else {
      return '⡄';
    }
  } else if (leftRemainder >= 0) {
    // ⣸, ⣰, ⣠, ⣀
    if (rightRemainder > 3 / 4) {
      return "⣸";
    } else if (rightRemainder > 1 / 2) {
      return '⣰';
    } else if(rightRemainder > 1 / 4) {
      return '⣠';
    } else if (rightRemainder >= 0 || lineNumber === 0) {
      return '⣀';
    } else {
      return '⡀'
    }
  } else if (rightRemainder > 0) {
    // ⢸, ⢰, ⢠, ⢀
    if (rightRemainder > 3 / 4) {
      return "⢸";
    } else if (rightRemainder > 1 / 2) {
      return '⢰';
    } else if(rightRemainder > 1 / 4) {
      return '⢠';
    } else if (lineNumber === 0) {
      return '⣀';
    } else {
      return '⢀';
    }
  } else if (lineNumber === 0) {
    return "⣀";
  }
  // console.log(leftRemainder, rightRemainder)
  return "⠀";
}