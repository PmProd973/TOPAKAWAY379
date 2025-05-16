declare module 'dxf-parser' {
  class DxfParser {
    parseSync(dxfString: string): DxfData;
    parse(dxfString: string, callback: (err: Error | null, dxf?: DxfData) => void): void;
    parseStream(stream: NodeJS.ReadableStream, callback: (err: Error | null, dxf?: DxfData) => void): void;
  }

  export interface DxfData {
    header: Record<string, any>;
    entities: DxfEntity[];
    tables?: Record<string, any>;
    blocks?: Record<string, any>;
    [key: string]: any;
  }

  export interface DxfEntity {
    type: string;
    [key: string]: any;
  }

  export interface DxfPoint {
    x: number;
    y: number;
    z?: number;
  }

  export interface DxfCircle extends DxfEntity {
    type: 'CIRCLE';
    center: DxfPoint;
    radius: number;
  }

  export interface DxfLine extends DxfEntity {
    type: 'LINE';
    start: DxfPoint;
    end: DxfPoint;
  }

  export interface DxfPolyline extends DxfEntity {
    type: 'LWPOLYLINE' | 'POLYLINE';
    vertices: DxfPoint[];
    shape?: boolean;
    closed?: boolean;
  }

  export interface DxfArc extends DxfEntity {
    type: 'ARC';
    center: DxfPoint;
    radius: number;
    startAngle: number;
    endAngle: number;
  }

  export interface DxfSpline extends DxfEntity {
    type: 'SPLINE';
    controlPoints: DxfPoint[];
    degree: number;
    knots: number[];
  }

  const DxfParser: {
    default: typeof DxfParser;
    new(): DxfParser;
  };

  export default DxfParser;
}