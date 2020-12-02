export default function getCharacterFromRemainders(leftRemainder, rightRemainder, isBaseline: boolean) {
  if (leftRemainder > 3 / 4) {
    if (rightRemainder > 3 / 4) {
      return "⣿";
    } else if (rightRemainder > 1 / 2) {
      return '⣷';
    } else if(rightRemainder > 1 / 4) {
      return '⣧';
    } else if (rightRemainder >= 0 || isBaseline) {
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
    } else if (rightRemainder >= 0 || isBaseline) {
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
    } else if (rightRemainder >= 0 || isBaseline) {
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
    } else if (rightRemainder >= 0 || isBaseline) {
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
    } else if (isBaseline) {
      return '⣀';
    } else {
      return '⢀';
    }
  } else if (isBaseline) {
    return "⣀";
  }
  return "⠀"; // braille character w/ no dots
}