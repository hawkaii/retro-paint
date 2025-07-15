export class FloodFill {
  private imageData: ImageData;
  private targetColor: number[];
  private replacementColor: number[];
  private width: number;
  private height: number;

  constructor(
    context: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColor: string
  ) {
    this.imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    this.width = this.imageData.width;
    this.height = this.imageData.height;

    const targetColorIndex = (startY * this.width + startX) * 4;
    this.targetColor = [
      this.imageData.data[targetColorIndex],
      this.imageData.data[targetColorIndex + 1],
      this.imageData.data[targetColorIndex + 2],
      this.imageData.data[targetColorIndex + 3]
    ];

    // Convert hex color to RGB
    const hex = fillColor.replace('#', '');
    this.replacementColor = [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
      255
    ];
  }

  fill(startX: number, startY: number): ImageData {
    if (this.colorsEqual(this.targetColor, this.replacementColor)) {
      return this.imageData;
    }

    const stack = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
      
      const index = (y * this.width + x) * 4;
      const currentColor = [
        this.imageData.data[index],
        this.imageData.data[index + 1],
        this.imageData.data[index + 2],
        this.imageData.data[index + 3]
      ];

      if (!this.colorsEqual(currentColor, this.targetColor)) continue;

      this.imageData.data[index] = this.replacementColor[0];
      this.imageData.data[index + 1] = this.replacementColor[1];
      this.imageData.data[index + 2] = this.replacementColor[2];
      this.imageData.data[index + 3] = this.replacementColor[3];

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return this.imageData;
  }

  private colorsEqual(color1: number[], color2: number[]): boolean {
    return color1[0] === color2[0] && 
           color1[1] === color2[1] && 
           color1[2] === color2[2] && 
           color1[3] === color2[3];
  }
}

export const drawShape = (
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  shapeType: string,
  color: string,
  lineWidth: number
) => {
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();

  switch (shapeType) {
    case 'rectangle':
      context.rect(startX, startY, endX - startX, endY - startY);
      break;
    case 'circle':
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      context.arc(startX, startY, radius, 0, 2 * Math.PI);
      break;
    case 'triangle':
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.lineTo(startX - (endX - startX), endY);
      context.closePath();
      break;
    case 'line':
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      break;
  }
  
  context.stroke();
};

export const getCanvasPosition = (
  event: React.MouseEvent | MouseEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } | null => {
  const rect = canvas.getBoundingClientRect();
  if (!rect) return null;
  
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};