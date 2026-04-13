"use client";

import * as React from "react";
import { fabric } from "fabric";
import { Button } from "@/components/ui/button";
import {
  Download,
  X,
  Square,
  Trash2,
  Undo2,
  Redo2,
  MousePointer,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Type,
  Minus as LineIcon,
  Pen,
} from "lucide-react";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
  rectInfo?: {
    x: number;
    y: number;
    width: number;
    height: number;
    videoWidth: number;
    videoHeight: number;
    originalWidth: number;
    originalHeight: number;
  };
}

export function ImageEditor({
  imageUrl,
  onSave,
  onCancel,
  rectInfo,
}: ImageEditorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = React.useState<fabric.Canvas | null>(null);
  const backgroundImageRef = React.useRef<fabric.Image | null>(null);
  const [activeTool, setActiveTool] = React.useState<
    "select" | "rectangle" | "line" | "pen" | "text"
  >("rectangle");
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [drawingObject, setDrawingObject] = React.useState<
    fabric.Rect | fabric.Line | fabric.Path | null
  >(null);
  const [pathPoints, setPathPoints] = React.useState<
    { x: number; y: number }[]
  >([]);
  const [startPointer, setStartPointer] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyStep, setHistoryStep] = React.useState(-1);
  const [selectedObject, setSelectedObject] =
    React.useState<fabric.Object | null>(null);
  const [strokeColor, setStrokeColor] = React.useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = React.useState(2);
  const [fontSize, setFontSize] = React.useState(20);
  const [zoom, setZoom] = React.useState(1);
  const canvasDimensionsRef = React.useRef({ width: 1200, height: 1200 });
  const [canvasScale, setCanvasScale] = React.useState(1);
  const [isPanning, setIsPanning] = React.useState(false);
  const [lastPanPoint, setLastPanPoint] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  // Initialize canvas
  React.useEffect(() => {
    if (!canvasRef.current) return;

    // Calculate canvas size based on screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Reserve space for header (72px) and toolbar (80px)
    const availableHeight = screenHeight - 152;
    const availableWidth = screenWidth - 32; // Account for padding

    // If rectInfo is provided, match the aspect ratio of the captured image
    let canvasWidth: number;
    let canvasHeight: number;

    if (rectInfo) {
      const imageAspectRatio = rectInfo.videoWidth / rectInfo.videoHeight;

      // Calculate dimensions that fit within available space while maintaining aspect ratio
      if (imageAspectRatio > availableWidth / availableHeight) {
        // Image is wider - fit to width
        canvasWidth = Math.min(availableWidth, 1200);
        canvasHeight = canvasWidth / imageAspectRatio;
      } else {
        // Image is taller - fit to height
        canvasHeight = Math.min(availableHeight, 1200);
        canvasWidth = canvasHeight * imageAspectRatio;
      }
    } else {
      // No rectInfo - use default square-ish canvas
      canvasWidth = Math.min(availableWidth, 1200);
      canvasHeight = Math.min(availableHeight, 1200);
    }

    canvasDimensionsRef.current = { width: canvasWidth, height: canvasHeight };

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      selection: true,
    });

    setCanvas(fabricCanvas);

    // Load image
    fabric.Image.fromURL(
      imageUrl,
      (img: any) => {
        const scale = Math.min(
          canvasWidth / (img.width || 1),
          canvasHeight / (img.height || 1),
        );

        img.scale(scale);
        img.set({
          left: (canvasWidth - (img.width || 0) * scale) / 2,
          top: (canvasHeight - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
          name: "background-image",
        });

        fabricCanvas.add(img);
        fabricCanvas.sendToBack(img);
        fabricCanvas.renderAll();

        // Store background image reference
        backgroundImageRef.current = img;

        // Pre-draw rectangle from camera if position info is provided
        if (rectInfo) {
          // Calculate scale between original image and canvas
          const scaleX = canvasWidth / rectInfo.videoWidth;
          const scaleY = canvasHeight / rectInfo.videoHeight;

          // Scale rectangle position and size to canvas dimensions
          const canvasRectX = rectInfo.x * scaleX;
          const canvasRectY = rectInfo.y * scaleY;
          const canvasRectWidth = rectInfo.width * scaleX;
          const canvasRectHeight = rectInfo.height * scaleY;

          // Create the rectangle at the scaled position
          const rectId = `rect-${Date.now()}`;
          const rect = new fabric.Rect({
            left: canvasRectX,
            top: canvasRectY,
            width: canvasRectWidth,
            height: canvasRectHeight,
            fill: "transparent",
            stroke: "#facc15", // yellow-400 to match camera guideline
            strokeWidth: 3,
            selectable: true,
            rectangleId: rectId,
          } as any);

          fabricCanvas.add(rect);

          // Add width label on top edge
          const widthText = new fabric.IText(String(rectInfo.originalWidth), {
            left: canvasRectX + canvasRectWidth / 2,
            top: canvasRectY,
            fontSize: 16,
            fill: "#facc15",
            fontFamily: "Arial",
            textAlign: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: 4,
            originX: "center",
            originY: "bottom",
            selectable: true,
            linkedRectId: rectId,
            labelSide: "top",
          } as any);

          fabricCanvas.add(widthText);

          // Add height label on right edge
          const heightText = new fabric.IText(String(rectInfo.originalHeight), {
            left: canvasRectX + canvasRectWidth,
            top: canvasRectY + canvasRectHeight / 2,
            fontSize: 16,
            fill: "#facc15",
            fontFamily: "Arial",
            textAlign: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: 4,
            originX: "left",
            originY: "center",
            selectable: true,
            linkedRectId: rectId,
            labelSide: "right",
          } as any);

          fabricCanvas.add(heightText);
          fabricCanvas.renderAll();
        }

        // Save initial state
        saveHistory(fabricCanvas);
      },
      { crossOrigin: "anonymous" },
    );

    return () => {
      fabricCanvas.dispose();
    };
  }, [imageUrl]);

  // Save history
  const saveHistory = (canvas: fabric.Canvas) => {
    // Get all objects except the background image
    const objects = canvas
      .getObjects()
      .filter((obj) => obj.name !== "background-image");

    // Temporarily remove background image, save state, then restore it
    const allObjects = canvas.getObjects();
    const backgroundImage = allObjects.find(
      (obj) => obj.name === "background-image",
    );

    if (backgroundImage) {
      canvas.remove(backgroundImage);
    }

    const json = JSON.stringify(
      canvas.toJSON([
        "name",
        "selectable",
        "evented",
        "rectangleId",
        "labelSide",
        "linkedRectId",
      ]),
    );

    if (backgroundImage) {
      canvas.add(backgroundImage);
      canvas.sendToBack(backgroundImage);
    }

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(json);
      setHistoryStep(newHistory.length - 1);
      return newHistory;
    });
  };

  // Enable/disable drawing mode for pen tool
  React.useEffect(() => {
    if (!canvas) return;

    if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.selection = false;
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = activeTool === "select";
    }

    canvas.renderAll();
  }, [canvas, activeTool, strokeColor, strokeWidth]);

  // Handle path created event for freehand drawing
  React.useEffect(() => {
    if (!canvas) return;

    const handlePathCreated = (e: any) => {
      const path = e.path;
      if (path) {
        // Save history after drawing
        saveHistory(canvas);

        // Switch to select tool and select the drawn path
        setActiveTool("select");
        canvas.setActiveObject(path);
        canvas.renderAll();
      }
    };

    canvas.on("path:created", handlePathCreated);

    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas]);

  // Handle rectangle and line drawing
  React.useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: fabric.IEvent) => {
      const target = canvas.findTarget(e.e, false);

      if (target && target.name !== "background-image") {
        // Clicking on existing shape - select it immediately
        canvas.setActiveObject(target);
        canvas.renderAll();
        return;
      }

      // Deselect any selected objects when clicking on empty space
      if (activeTool === "select") {
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }

      // Handle text tool - add text at click position
      if (activeTool === "text") {
        const pointer = canvas.getPointer(e.e);
        const text = new fabric.IText("Text", {
          left: pointer.x,
          top: pointer.y,
          fontSize: 20,
          fill: strokeColor,
          fontFamily: "Arial",
          selectable: true,
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        canvas.renderAll();

        // Save history and switch to select tool
        saveHistory(canvas);
        setActiveTool("select");
        return;
      }

      // Only start drawing if rectangle or line tool is active
      if (activeTool !== "rectangle" && activeTool !== "line") return;

      // Start drawing
      setIsDrawing(true);
      const pointer = canvas.getPointer(e.e);
      setStartPointer(pointer);

      if (activeTool === "rectangle") {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          selectable: false,
          rectangleId: `rect-${Date.now()}`,
        } as any);

        setDrawingObject(rect);
        canvas.add(rect);
      } else if (activeTool === "line") {
        const line = new fabric.Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            selectable: false,
          },
        );

        setDrawingObject(line);
        canvas.add(line);
      }

      canvas.renderAll();
    };

    const handleMouseMove = (e: fabric.IEvent) => {
      if (!isDrawing || !drawingObject || !startPointer) return;

      const pointer = canvas.getPointer(e.e);

      if (activeTool === "rectangle" && drawingObject.type === "rect") {
        (drawingObject as fabric.Rect).set({
          width: Math.abs(pointer.x - startPointer.x),
          height: Math.abs(pointer.y - startPointer.y),
          left: Math.min(startPointer.x, pointer.x),
          top: Math.min(startPointer.y, pointer.y),
        });
      } else if (activeTool === "line" && drawingObject.type === "line") {
        (drawingObject as fabric.Line).set({
          x2: pointer.x,
          y2: pointer.y,
        });
      }

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (isDrawing && drawingObject) {
        if (drawingObject.type === "rect") {
          (drawingObject as fabric.Rect).set({ selectable: true });
        } else if (drawingObject.type === "line") {
          (drawingObject as fabric.Line).set({ selectable: true });
        }

        // Select the newly drawn shape
        canvas.setActiveObject(drawingObject);
        canvas.renderAll();

        setIsDrawing(false);
        setDrawingObject(null);
        setStartPointer(null);

        // Save history after drawing
        if (canvas) {
          saveHistory(canvas);
        }

        // Switch to select tool after drawing
        setActiveTool("select");
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [canvas, isDrawing, drawingObject, startPointer, activeTool]);

  // Track object modifications (move, resize, etc.)
  React.useEffect(() => {
    if (!canvas) return;

    const handleObjectModified = () => {
      saveHistory(canvas);
    };

    canvas.on("object:modified", handleObjectModified);

    return () => {
      canvas.off("object:modified", handleObjectModified);
    };
  }, [canvas, historyStep]);

  // Zoom and pan functionality
  React.useEffect(() => {
    if (!canvas) return;

    let isPanning = false;
    let lastPanPoint = { x: 0, y: 0 };

    // Mouse wheel zoom
    const handleWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** delta;
      if (newZoom > 5) newZoom = 5;
      if (newZoom < 0.1) newZoom = 0.1;

      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(point, newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    };

    // Pan on mouse drag with Alt key
    const handleMouseDown = (opt: any) => {
      const evt = opt.e;
      if (evt.altKey === true) {
        isPanning = true;
        lastPanPoint = { x: evt.clientX, y: evt.clientY };
        canvas.selection = false;
        evt.preventDefault();
      }
    };

    const handleMouseMove = (opt: any) => {
      if (isPanning) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPanPoint.x;
          vpt[5] += evt.clientY - lastPanPoint.y;
          canvas.requestRenderAll();
          lastPanPoint = { x: evt.clientX, y: evt.clientY };
        }
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        canvas.selection = true;
      }
    };

    // Touch events for mobile pinch-to-zoom
    let touchStartDistance = 0;
    let touchStartZoom = 1;
    let touchStartCenter = { x: 0, y: 0 };

    const getTouchDistance = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );
    };

    const getTouchCenter = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    };

    const handleTouchStart = (opt: any) => {
      const evt = opt.e;
      if (evt.touches && evt.touches.length === 2) {
        touchStartDistance = getTouchDistance(evt.touches);
        touchStartZoom = canvas.getZoom();
        touchStartCenter = getTouchCenter(evt.touches);
        canvas.selection = false;
        evt.preventDefault();
      }
    };

    const handleTouchMove = (opt: any) => {
      const evt = opt.e;
      if (evt.touches && evt.touches.length === 2) {
        const currentDistance = getTouchDistance(evt.touches);
        const currentCenter = getTouchCenter(evt.touches);

        let newZoom = touchStartZoom * (currentDistance / touchStartDistance);
        if (newZoom > 5) newZoom = 5;
        if (newZoom < 0.1) newZoom = 0.1;

        // Get canvas bounds
        const canvasElement = canvas.getElement();
        const rect = canvasElement.getBoundingClientRect();

        // Calculate point relative to canvas
        const pointX = currentCenter.x - rect.left;
        const pointY = currentCenter.y - rect.top;
        const point = new fabric.Point(pointX, pointY);

        canvas.zoomToPoint(point, newZoom);
        setZoom(newZoom);
        evt.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      canvas.selection = true;
    };

    canvas.on("mouse:wheel", handleWheel);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    canvas.on("touch:start", handleTouchStart);
    canvas.on("touch:move", handleTouchMove);
    canvas.on("touch:end", handleTouchEnd);

    return () => {
      canvas.off("mouse:wheel", handleWheel);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      canvas.off("touch:start", handleTouchStart);
      canvas.off("touch:move", handleTouchMove);
      canvas.off("touch:end", handleTouchEnd);
    };
  }, [canvas]);

  // Zoom control functions
  const handleZoomIn = () => {
    if (!canvas) return;
    let newZoom = canvas.getZoom() * 1.2;
    if (newZoom > 5) newZoom = 5;
    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    let newZoom = canvas.getZoom() / 1.2;
    if (newZoom < 0.1) newZoom = 0.1;
    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
  };

  // Track object selection
  React.useEffect(() => {
    if (!canvas) return;

    const handleSelection = (e: any) => {
      const selected = e.selected?.[0];
      if (selected && selected.name !== "background-image") {
        setSelectedObject(selected);

        // For text objects, get fill color; for shapes, get stroke color
        if (selected.type === "i-text" || selected.type === "text") {
          setStrokeColor(selected.fill || "#ff0000");
          setFontSize(selected.fontSize || 20);
        } else {
          setStrokeColor(selected.stroke || "#ff0000");
        }

        setStrokeWidth(selected.strokeWidth || 2);
      }
    };

    const handleDeselection = () => {
      setSelectedObject(null);
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleDeselection);

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleDeselection);
    };
  }, [canvas]);

  // Handle double-click to add text labels on rectangle edges
  React.useEffect(() => {
    if (!canvas) return;

    const handleDoubleClick = (e: fabric.IEvent) => {
      const target = e.target;
      if (
        !target ||
        target.name === "background-image" ||
        target.type !== "rect"
      )
        return;

      const pointer = canvas.getPointer(e.e);
      const rect = target as fabric.Rect;
      const rectId = (rect as any).rectangleId;
      if (!rectId) return;

      // Calculate which side was clicked
      const rectLeft = rect.left || 0;
      const rectTop = rect.top || 0;
      const rectWidth = rect.width || 0;
      const rectHeight = rect.height || 0;

      const relativeX = pointer.x - rectLeft;
      const relativeY = pointer.y - rectTop;

      let side: "top" | "bottom" | "left" | "right";
      let textLeft: number;
      let textTop: number;

      // Determine which edge is closest
      const distanceToTop = relativeY;
      const distanceToBottom = rectHeight - relativeY;
      const distanceToLeft = relativeX;
      const distanceToRight = rectWidth - relativeX;

      const minDistance = Math.min(
        distanceToTop,
        distanceToBottom,
        distanceToLeft,
        distanceToRight,
      );

      if (minDistance === distanceToTop) {
        side = "top";
        textLeft = pointer.x; // Use exact click position
        textTop = rectTop;
      } else if (minDistance === distanceToBottom) {
        side = "bottom";
        textLeft = pointer.x; // Use exact click position
        textTop = rectTop + rectHeight;
      } else if (minDistance === distanceToLeft) {
        side = "left";
        textLeft = rectLeft;
        textTop = pointer.y; // Use exact click position
      } else {
        side = "right";
        textLeft = rectLeft + rectWidth;
        textTop = pointer.y; // Use exact click position
      }

      // Check if text already exists on this side
      const existingText = canvas
        .getObjects()
        .find(
          (obj) =>
            obj.type === "i-text" &&
            (obj as any).linkedRectId === rectId &&
            (obj as any).labelSide === side,
        );

      if (existingText) {
        // Select and allow editing
        canvas.setActiveObject(existingText);
        (existingText as fabric.IText).enterEditing();
        canvas.renderAll();
        return;
      }

      // Create new text
      const text = new fabric.IText("", {
        left: textLeft,
        top: textTop,
        fontSize: 16,
        fill: rect.stroke || "#ff0000",
        fontFamily: "Arial",
        textAlign: "center",
        backgroundColor: "white",
        padding: 4,
        originX: "center",
        originY: "center",
        linkedRectId: rectId,
        labelSide: side,
      } as any);

      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();
      saveHistory(canvas);
    };

    canvas.on("mouse:dblclick", handleDoubleClick);

    return () => {
      canvas.off("mouse:dblclick", handleDoubleClick);
    };
  }, [canvas]);

  // Handle text alignment after editing
  React.useEffect(() => {
    if (!canvas) return;

    const handleTextEditingExit = (e: any) => {
      const text = e.target;
      if (!text || text.type !== "i-text") return;

      const linkedRectId = (text as any).linkedRectId;
      const labelSide = (text as any).labelSide;
      if (!linkedRectId || !labelSide) return;

      // Find the linked rectangle
      const rect = canvas
        .getObjects()
        .find(
          (obj) =>
            obj.type === "rect" && (obj as any).rectangleId === linkedRectId,
        ) as fabric.Rect;

      if (!rect) return;

      // Reposition text to align with rectangle edge
      const rectLeft = rect.left || 0;
      const rectTop = rect.top || 0;
      const rectWidth = rect.width || 0;
      const rectHeight = rect.height || 0;

      if (labelSide === "top") {
        text.set({
          left: rectLeft + rectWidth / 2,
          top: rectTop,
          originX: "center",
          originY: "center",
        });
      } else if (labelSide === "bottom") {
        text.set({
          left: rectLeft + rectWidth / 2,
          top: rectTop + rectHeight,
          originX: "center",
          originY: "center",
        });
      } else if (labelSide === "left") {
        text.set({
          left: rectLeft,
          top: rectTop + rectHeight / 2,
          originX: "center",
          originY: "center",
        });
      } else if (labelSide === "right") {
        text.set({
          left: rectLeft + rectWidth,
          top: rectTop + rectHeight / 2,
          originX: "center",
          originY: "center",
        });
      }

      canvas.renderAll();
      saveHistory(canvas);
    };

    canvas.on("text:editing:exited", handleTextEditingExit);

    return () => {
      canvas.off("text:editing:exited", handleTextEditingExit);
    };
  }, [canvas]);

  // Update selected object properties
  const updateObjectStroke = (color: string) => {
    if (!canvas || !selectedObject) return;

    // For text objects, update fill color instead of stroke
    if (selectedObject.type === "i-text" || selectedObject.type === "text") {
      selectedObject.set({ fill: color });
    } else {
      selectedObject.set({ stroke: color });
    }

    setStrokeColor(color);
    canvas.renderAll();
    saveHistory(canvas);
  };

  const updateObjectStrokeWidth = (width: number) => {
    if (!canvas || !selectedObject) return;
    selectedObject.set({ strokeWidth: width });
    setStrokeWidth(width);
    canvas.renderAll();
    saveHistory(canvas);
  };

  const updateFontSize = (size: number) => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.type === "i-text" || selectedObject.type === "text") {
      (selectedObject as fabric.IText).set({ fontSize: size });
      setFontSize(size);
      canvas.renderAll();
      saveHistory(canvas);
    }
  };

  // Add text label to specific side of rectangle
  const addTextToSide = (side: "top" | "bottom" | "left" | "right") => {
    if (!canvas || !selectedObject || selectedObject.type !== "rect") return;

    const rect = selectedObject as fabric.Rect;
    const rectId = (rect as any).rectangleId;
    if (!rectId) return;

    const rectLeft = rect.left || 0;
    const rectTop = rect.top || 0;
    const rectWidth = rect.width || 0;
    const rectHeight = rect.height || 0;

    let textLeft: number;
    let textTop: number;

    // Calculate position based on side
    if (side === "top") {
      textLeft = rectLeft + rectWidth / 2;
      textTop = rectTop;
    } else if (side === "bottom") {
      textLeft = rectLeft + rectWidth / 2;
      textTop = rectTop + rectHeight;
    } else if (side === "left") {
      textLeft = rectLeft;
      textTop = rectTop + rectHeight / 2;
    } else {
      textLeft = rectLeft + rectWidth;
      textTop = rectTop + rectHeight / 2;
    }

    // Check if text already exists on this side
    const existingText = canvas
      .getObjects()
      .find(
        (obj) =>
          obj.type === "i-text" &&
          (obj as any).linkedRectId === rectId &&
          (obj as any).labelSide === side,
      );

    if (existingText) {
      // Select and allow editing
      canvas.setActiveObject(existingText);
      (existingText as fabric.IText).enterEditing();
      canvas.renderAll();
      return;
    }

    // Create new text
    const text = new fabric.IText("", {
      left: textLeft,
      top: textTop,
      fontSize: 16,
      fill: rect.stroke || "#ff0000",
      fontFamily: "Arial",
      textAlign: "center",
      backgroundColor: "white",
      padding: 4,
      originX: "center",
      originY: "center",
      linkedRectId: rectId,
      labelSide: side,
    } as any);

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
    saveHistory(canvas);
  };

  // Delete selected object
  const deleteSelected = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.name !== "background-image") {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveHistory(canvas);
    }
  };

  // Undo
  const handleUndo = () => {
    if (!canvas || historyStep <= 0) return;
    const prevStep = historyStep - 1;
    setHistoryStep(prevStep);

    // Store background image
    const backgroundImage = backgroundImageRef.current;

    canvas.loadFromJSON(history[prevStep], () => {
      // Re-add background image if it exists
      if (backgroundImage) {
        canvas.add(backgroundImage);
        canvas.sendToBack(backgroundImage);
      }
      canvas.renderAll();
    });
  };

  // Redo
  const handleRedo = () => {
    if (!canvas || historyStep >= history.length - 1) return;
    const nextStep = historyStep + 1;
    setHistoryStep(nextStep);

    // Store background image
    const backgroundImage = backgroundImageRef.current;

    canvas.loadFromJSON(history[nextStep], () => {
      // Re-add background image if it exists
      if (backgroundImage) {
        canvas.add(backgroundImage);
        canvas.sendToBack(backgroundImage);
      }
      canvas.renderAll();
    });
  };

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [canvas, historyStep, history]);

  // Save edited image
  const handleSave = async () => {
    if (!canvas || !backgroundImageRef.current) return;

    canvas.discardActiveObject();
    canvas.renderAll();

    // Store current zoom level
    const currentZoom = zoom;

    // Reset zoom to 100% before saving
    if (currentZoom !== 1) {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.renderAll();
    }

    // Get current canvas dimensions
    const currentWidth = canvas.getWidth();
    const currentHeight = canvas.getHeight();

    // Calculate target dimensions (always 1200px width with proportionate height)
    const targetWidth = 1200;
    const aspectRatio = currentHeight / currentWidth;
    const targetHeight = targetWidth * aspectRatio;
    const scale = targetWidth / currentWidth;

    // Always resize to 1200px width for consistency
    if (scale !== 1) {
      // Create a temporary canvas with target dimensions
      const tempCanvas = new fabric.Canvas(document.createElement("canvas"), {
        width: targetWidth,
        height: targetHeight,
        backgroundColor: "#ffffff",
      });

      // Clone all objects from the original canvas
      const json = canvas.toJSON([
        "name",
        "selectable",
        "evented",
        "rectangleId",
        "labelSide",
        "linkedRectId",
      ]);

      // Load the JSON into temp canvas and scale everything
      await new Promise<void>((resolve) => {
        tempCanvas.loadFromJSON(json, () => {
          interface ScalableObject extends fabric.Object {
            scaleX?: number;
            scaleY?: number;
            left?: number;
            top?: number;
          }

          // Updated selection code:
          tempCanvas.getObjects().forEach((obj: ScalableObject) => {
            obj.scaleX = (obj.scaleX || 1) * scale;
            obj.scaleY = (obj.scaleY || 1) * scale;
            obj.left = (obj.left || 0) * scale;
            obj.top = (obj.top || 0) * scale;
            obj.setCoords();
          });
          tempCanvas.renderAll();
          resolve();
        });
      });

      // Export from the scaled canvas
      const dataUrl = tempCanvas.toDataURL({
        format: "png",
        quality: 1,
      });

      tempCanvas.dispose();

      // Restore zoom level
      if (currentZoom !== 1) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[0] = currentZoom;
          vpt[3] = currentZoom;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        }
      }

      const blob = await (await fetch(dataUrl)).blob();
      onSave(blob);
    } else {
      // Canvas is already exactly 1200px, save as is
      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
      });

      // Restore zoom level
      if (currentZoom !== 1) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[0] = currentZoom;
          vpt[3] = currentZoom;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        }
      }

      const blob = await (await fetch(dataUrl)).blob();
      onSave(blob);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/90 flex flex-col">
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-auto touch-pan-x touch-pan-y\">
        <canvas
          ref={canvasRef}
          className="shadow-2xl"
          style={{
            display: "block",
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-[95vw]">
        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-gray-200 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTool("select")}
              className={
                activeTool === "select"
                  ? "bg-blue-500 text-white hover:bg-blue-600 h-9 w-9 rounded-full"
                  : "text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full"
              }
              title="Select Tool"
            >
              <MousePointer className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTool("rectangle")}
              className={
                activeTool === "rectangle"
                  ? "bg-blue-500 text-white hover:bg-blue-600 h-9 w-9 rounded-full"
                  : "text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full"
              }
              title="Rectangle Tool"
            >
              <Square className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTool("line")}
              className={
                activeTool === "line"
                  ? "bg-blue-500 text-white hover:bg-blue-600 h-9 w-9 rounded-full"
                  : "text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full"
              }
              title="Line Tool"
            >
              <LineIcon className="h-4 w-4 rotate-90" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTool("pen")}
              className={
                activeTool === "pen"
                  ? "bg-blue-500 text-white hover:bg-blue-600 h-9 w-9 rounded-full"
                  : "text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full"
              }
              title="Pen Tool (Freehand)"
            >
              <Pen className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTool("text")}
              className={
                activeTool === "text"
                  ? "bg-blue-500 text-white hover:bg-blue-600 h-9 w-9 rounded-full"
                  : "text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full"
              }
              title="Text Tool"
            >
              <Type className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={deleteSelected}
              className="text-red-500 hover:bg-red-50 h-9 w-9 rounded-full"
              title="Delete Selected (Del)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={historyStep <= 0}
              className="text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full disabled:opacity-30 disabled:text-gray-400"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              className="text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full disabled:opacity-30 disabled:text-gray-400"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            {/* <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="text-gray-700 hover:bg-gray-100 rounded-full px-3"
              title="Reset Zoom"
            >
              <span className="text-xs font-medium">
                {Math.round(zoom * 100)}%
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-gray-700 hover:bg-gray-100 h-9 w-9 rounded-full"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button> */}

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              onClick={handleSave}
              className="text-green-600 hover:bg-green-50 rounded-full px-4 h-9 font-medium"
              title="Save Image"
            >
              <Download className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Shape Customization Toolbar */}
      {selectedObject && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 max-w-[95vw]">
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 min-w-max">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  Color:
                </span>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => updateObjectStroke(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  title="Stroke Color"
                />
              </div>

              <div className="w-px h-6 bg-gray-300" />

              {/* Font Size for text objects, Stroke Width for shapes */}
              {selectedObject.type === "i-text" ||
              selectedObject.type === "text" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">
                    Font Size:
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateFontSize(Math.max(8, fontSize - 2))}
                    className="h-7 w-7 rounded-full text-gray-700 hover:bg-gray-100"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 min-w-5 text-center">
                    {fontSize}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateFontSize(Math.min(72, fontSize + 2))}
                    className="h-7 w-7 rounded-full text-gray-700 hover:bg-gray-100"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">
                    Stroke:
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateObjectStrokeWidth(Math.max(1, strokeWidth - 1))
                    }
                    className="h-7 w-7 rounded-full text-gray-700 hover:bg-gray-100"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 min-w-5 text-center">
                    {strokeWidth}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateObjectStrokeWidth(Math.min(10, strokeWidth + 1))
                    }
                    className="h-7 w-7 rounded-full text-gray-700 hover:bg-gray-100"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {selectedObject.type === "rect" && (
                <>
                  <div className="w-px h-6 bg-gray-300" />

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">
                      Add Text:
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addTextToSide("top")}
                      className="h-7 w-7 rounded text-gray-700 hover:bg-gray-100"
                      title="Add text on top"
                    >
                      <div className="flex flex-col items-center">
                        <Type className="h-3 w-3" />
                        <span className="text-[8px]">T</span>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addTextToSide("right")}
                      className="h-7 w-7 rounded text-gray-700 hover:bg-gray-100"
                      title="Add text on right"
                    >
                      <div className="flex items-center">
                        <Type className="h-3 w-3" />
                        <span className="text-[8px]">R</span>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addTextToSide("bottom")}
                      className="h-7 w-7 rounded text-gray-700 hover:bg-gray-100"
                      title="Add text on bottom"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[8px]">B</span>
                        <Type className="h-3 w-3" />
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addTextToSide("left")}
                      className="h-7 w-7 rounded text-gray-700 hover:bg-gray-100"
                      title="Add text on left"
                    >
                      <div className="flex items-center">
                        <span className="text-[8px]">L</span>
                        <Type className="h-3 w-3" />
                      </div>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
