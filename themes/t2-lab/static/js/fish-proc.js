function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);

  // canvasを物理的にbody最後に強制移動
  setTimeout(() => {
    try {
      document.body.appendChild(cnv.elt);
    } catch (e) {}
  }, 0);

  cnv.style("position", "fixed");
  cnv.style("inset", "0");
  cnv.style("z-index", "-9999");
  cnv.style("width", "100vw");
  cnv.style("height", "100vh");
  cnv.style("pointer-events", "none");
  fish = new Fish(createVector(width / 2, height / 2));
  noCursor();
}

// ---- Chainクラス ----
class Chain {
  constructor(origin, jointCount, linkSize, angleConstraint = Math.PI * 2) {
    this.linkSize = linkSize;
    this.angleConstraint = angleConstraint;
    this.joints = [origin.copy()];
    this.angles = [0];
    for (let i = 1; i < jointCount; i++) {
      this.joints.push(p5.Vector.add(this.joints[i - 1], createVector(0, this.linkSize)));
      this.angles.push(0);
    }
  }
  resolve(pos) {
    this.angles[0] = p5.Vector.sub(pos, this.joints[0]).heading();
    this.joints[0] = pos.copy();
    for (let i = 1; i < this.joints.length; i++) {
      let curAngle = p5.Vector.sub(this.joints[i - 1], this.joints[i]).heading();
      this.angles[i] = this.constrainAngle(curAngle, this.angles[i - 1], this.angleConstraint);
      this.joints[i] = p5.Vector.sub(this.joints[i - 1], p5.Vector.fromAngle(this.angles[i]).setMag(this.linkSize));
    }
  }
  constrainAngle(angle, anchor, constraint) {
    let diff = this.relativeAngleDiff(angle, anchor);
    if (Math.abs(diff) <= constraint) return angle;
    if (diff > constraint) return anchor - constraint;
    return anchor + constraint;
  }
  relativeAngleDiff(angle, anchor) {
    angle = this.simplifyAngle(angle + Math.PI - anchor);
    anchor = Math.PI;
    return anchor - angle;
  }
  simplifyAngle(angle) {
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    while (angle < 0) angle += Math.PI * 2;
    return angle;
  }
}

// ---- Fishクラス ----
class Fish {
  constructor(origin) {
    this.spine = new Chain(origin, 12, 64, Math.PI / 8);
    this.bodyWidth = [68, 81, 84, 83, 77, 64, 51, 38, 32, 19];
    this.bodyColor = color(58, 124, 165);
    this.finColor = color(129, 195, 215);
  }

  resolve() {
    let headPos = this.spine.joints[0];
    let mousePos = createVector(mouseX, mouseY);
    let targetPos = p5.Vector.add(headPos, p5.Vector.sub(mousePos, headPos).setMag(16));
    this.spine.resolve(targetPos);
  }

  display() {
    strokeWeight(4);
    stroke(255);
    fill(this.finColor);

    let j = this.spine.joints;
    let a = this.spine.angles;

    // === 各種ヘルパー ===
    const getPosX = (i, angleOffset, lengthOffset) => j[i].x + Math.cos(a[i] + angleOffset) * ((this.bodyWidth[i] ?? 0) + lengthOffset);
    const getPosY = (i, angleOffset, lengthOffset) => j[i].y + Math.sin(a[i] + angleOffset) * ((this.bodyWidth[i] ?? 0) + lengthOffset);

    // === dorsal fin 計算補助 ===
    const relativeAngleDiff = (angle, anchor) => {
      angle = simplifyAngle(angle + Math.PI - anchor);
      anchor = Math.PI;
      return anchor - angle;
    };
    const simplifyAngle = (angle) => {
      while (angle >= Math.PI * 2) angle -= Math.PI * 2;
      while (angle < 0) angle += Math.PI * 2;
      return angle;
    };

    let headToMid1 = relativeAngleDiff(a[0], a[6]);
    let headToMid2 = relativeAngleDiff(a[0], a[7]);
    let headToTail = headToMid1 + relativeAngleDiff(a[6], a[11]);

    // === PECTORAL FINS ===
    push();
    translate(getPosX(3, Math.PI / 3, 0), getPosY(3, Math.PI / 3, 0));
    rotate(a[2] - Math.PI / 4);
    ellipse(0, 0, 160, 64); // Right
    pop();
    push();
    translate(getPosX(3, -Math.PI / 3, 0), getPosY(3, -Math.PI / 3, 0));
    rotate(a[2] + Math.PI / 4);
    ellipse(0, 0, 160, 64); // Left
    pop();

    // === VENTRAL FINS ===
    push();
    translate(getPosX(7, Math.PI / 2, 0), getPosY(7, Math.PI / 2, 0));
    rotate(a[6] - Math.PI / 4);
    ellipse(0, 0, 96, 32); // Right
    pop();
    push();
    translate(getPosX(7, -Math.PI / 2, 0), getPosY(7, -Math.PI / 2, 0));
    rotate(a[6] + Math.PI / 4);
    ellipse(0, 0, 96, 32); // Left
    pop();

    // === CAUDAL FINS ===
    beginShape();
    // "Bottom" of the fish
    for (let i = 8; i < 12; i++) {
      let tailWidth = 1.5 * headToTail * (i - 8) * (i - 8);
      curveVertex(j[i].x + Math.cos(a[i] - Math.PI / 2) * tailWidth, j[i].y + Math.sin(a[i] - Math.PI / 2) * tailWidth);
    }
    // "Top" of the fish
    for (let i = 11; i >= 8; i--) {
      let tailWidth = Math.max(-13, Math.min(13, headToTail * 6));
      curveVertex(j[i].x + Math.cos(a[i] + Math.PI / 2) * tailWidth, j[i].y + Math.sin(a[i] + Math.PI / 2) * tailWidth);
    }
    endShape(CLOSE);

    fill(this.bodyColor);

    // === BODY ===
    beginShape();
    // Right half
    for (let i = 0; i < 10; i++) {
      curveVertex(getPosX(i, Math.PI / 2, 0), getPosY(i, Math.PI / 2, 0));
    }
    // Bottom
    curveVertex(getPosX(9, Math.PI, 0), getPosY(9, Math.PI, 0));
    // Left half
    for (let i = 9; i >= 0; i--) {
      curveVertex(getPosX(i, -Math.PI / 2, 0), getPosY(i, -Math.PI / 2, 0));
    }
    // Top of the head (completes the loop)
    curveVertex(getPosX(0, -Math.PI / 6, 0), getPosY(0, -Math.PI / 6, 0));
    curveVertex(getPosX(0, 0, 4), getPosY(0, 0, 4));
    curveVertex(getPosX(0, Math.PI / 6, 0), getPosY(0, Math.PI / 6, 0));
    // Extra for curveVertex requirement
    curveVertex(getPosX(0, Math.PI / 2, 0), getPosY(0, Math.PI / 2, 0));
    curveVertex(getPosX(1, Math.PI / 2, 0), getPosY(1, Math.PI / 2, 0));
    curveVertex(getPosX(2, Math.PI / 2, 0), getPosY(2, Math.PI / 2, 0));
    endShape(CLOSE);

    fill(this.finColor);

    // === DORSAL FIN ===
    beginShape();
    vertex(j[4].x, j[4].y);
    bezierVertex(j[5].x, j[5].y, j[6].x, j[6].y, j[7].x, j[7].y);
    bezierVertex(
      j[6].x + Math.cos(a[6] + Math.PI / 2) * headToMid2 * 16,
      j[6].y + Math.sin(a[6] + Math.PI / 2) * headToMid2 * 16,
      j[5].x + Math.cos(a[5] + Math.PI / 2) * headToMid1 * 16,
      j[5].y + Math.sin(a[5] + Math.PI / 2) * headToMid1 * 16,
      j[4].x,
      j[4].y
    );
    endShape();

    // === EYES ===
    fill(255);
    ellipse(getPosX(0, Math.PI / 2, -18), getPosY(0, Math.PI / 2, -18), 24, 24);
    ellipse(getPosX(0, -Math.PI / 2, -18), getPosY(0, -Math.PI / 2, -18), 24, 24);
  }
}

// ---- グローバル変数 ----
let fish;

// ---- p5.js setup/draw ----
function setup() {
  createCanvas(windowWidth, windowHeight);
  fish = new Fish(createVector(width / 2, height / 2));
  noCursor();
}

function draw() {
  // 背景色（Processing同等：#282C34相当）
  background(40, 44, 52);

  // 魚アニメーション
  fish.resolve();
  fish.display();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
