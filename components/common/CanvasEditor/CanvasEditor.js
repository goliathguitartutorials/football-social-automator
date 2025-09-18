/*
 * ==========================================================
 * COMPONENT: CanvasEditor
 * PAGE: Create Post, Schedule Post
 * FILE: /components/common/CanvasEditor/CanvasEditor.js
 * ==========================================================
 */
'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Stage, Layer, Image, Transformer } from 'react-konva';
import styles from './CanvasEditor.module.css';

const useStageSize = () => {
    const containerRef = useRef(null);
    const [stageSize, setStageSize] = useState({ width: 700, height: 700 });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                const height = Math.min(width, 700);
                setStageSize({ width, height });
            }
        };
        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);
    return [containerRef, stageSize];
};

const CANVAS_CONFIG = {
    '1:1': { name: 'Square' },
    '4:5': { name: 'Portrait' },
    '9:16': { name: 'Story' },
    '16:9': { name: 'Landscape' },
};
const EXPORT_CONFIG = {
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
};
const ZOOM_STEP = 1.1;

// **NEW**: Helper function to calculate distance between two points
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export default function CanvasEditor({ imagePreview, onBack, onConfirm, initialState = null }) {
    const [image, setImage] = useState(null);
    const [isSelected, setIsSelected] = useState(false);
    
    const [aspectRatio, setAspectRatio] = useState(initialState?.aspectRatio || '1:1');
    const [inputWidth, setInputWidth] = useState(initialState?.inputWidth || EXPORT_CONFIG['1:1'].width);
    const [inputHeight, setInputHeight] = useState(initialState?.inputHeight || EXPORT_CONFIG['1:1'].height);

    const imageRef = useRef(null);
    const transformerRef = useRef(null);
    const stageRef = useRef(null);
    const isStateApplied = useRef(false);
    const lastDist = useRef(0); // For touch zoom
    const lastCenter = useRef(null); // For touch positioning
    const isTransforming = useRef(false); // Flag to manage touch state

    const [containerRef, stageSize] = useStageSize();

    const displayDimensions = useMemo(() => {
        const maxDim = stageSize.width * 0.9;
        if (!inputWidth || !inputHeight) return { width: maxDim, height: maxDim };
        
        const ratio = inputWidth / inputHeight;
        let scaledWidth = maxDim;
        let scaledHeight = scaledWidth / ratio;

        if (scaledHeight > maxDim) {
            scaledHeight = maxDim;
            scaledWidth = scaledHeight * ratio;
        }
        return { width: scaledWidth, height: scaledHeight };
    }, [aspectRatio, inputWidth, inputHeight, stageSize]);
    
    useEffect(() => {
        if (isSelected && imageRef.current && transformerRef.current) {
            transformerRef.current.nodes([imageRef.current]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [isSelected, image]);

    useEffect(() => {
        if (imagePreview) {
            const imageObj = new window.Image();
            imageObj.src = imagePreview;
            imageObj.onload = () => setImage(imageObj);
        }
    }, [imagePreview]);

    useEffect(() => {
        if (!image || !imageRef.current || !stageRef.current) return;

        if (initialState && !isStateApplied.current) {
            imageRef.current.setAttrs({
                x: initialState.x, y: initialState.y,
                scaleX: initialState.scaleX, scaleY: initialState.scaleY,
                rotation: initialState.rotation || 0,
                width: image.width, height: image.height,
                offsetX: image.width / 2, offsetY: image.height / 2,
            });
            isStateApplied.current = true;
        } else if (!isStateApplied.current) {
            const scale = Math.min(displayDimensions.width / image.width, displayDimensions.height / image.height, 1);
            imageRef.current.setAttrs({
                x: stageSize.width / 2, y: stageSize.height / 2,
                scaleX: scale, scaleY: scale,
                width: image.width, height: image.height,
                offsetX: image.width / 2, offsetY: image.height / 2,
            });
        }
        setIsSelected(true);
    }, [image, displayDimensions, initialState, stageSize]);

    const handleStageInteraction = (e) => {
        if (e.target === e.target.getStage()) setIsSelected(false);
    };

    // **NEW**: Touch gesture handlers for pinch-zoom and rotation
    const handleTouchStart = (e) => {
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];
        const imageNode = imageRef.current;
        if (touch1 && touch2 && imageNode) {
            isTransforming.current = true;
            lastDist.current = getDistance(touch1, touch2);
            lastCenter.current = { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };
        }
    };
    
    const handleTouchMove = (e) => {
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];
        const imageNode = imageRef.current;
        
        if (touch1 && touch2 && imageNode && isTransforming.current) {
            e.evt.preventDefault(); // Prevent page scrolling
            
            // Zoom
            const newDist = getDistance(touch1, touch2);
            const scale = (imageNode.scaleX() * newDist) / lastDist.current;
            imageNode.scaleX(scale);
            imageNode.scaleY(scale);
            lastDist.current = newDist;

            // Rotation
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            const newRotation = Math.atan2(dy, dx);
            const oldRotation = imageNode.rotation();
            const startRotation = Math.atan2(lastCenter.current.y - touch1.clientY, lastCenter.current.x - touch1.clientX);
            imageNode.rotation(oldRotation + (newRotation - startRotation));
            
            // We draw the layer manually for better performance
            transformerRef.current.getLayer().batchDraw();
        }
    };

    const handleTouchEnd = () => {
        isTransforming.current = false;
    };


    const handleManualZoom = (direction) => {
        const imageNode = imageRef.current;
        if (imageNode) {
            const oldScale = imageNode.scaleX();
            const newScale = direction === 'in' ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP;
            imageNode.scaleX(newScale);
            imageNode.scaleY(newScale);
        }
    };
    
    const handlePresetClick = (key) => {
        setAspectRatio(key);
        setInputWidth(EXPORT_CONFIG[key].width);
        setInputHeight(EXPORT_CONFIG[key].height);
    };

    const handleWidthChange = (e) => setInputWidth(Number(e.target.value)) & setAspectRatio('custom');
    const handleHeightChange = (e) => setInputHeight(Number(e.target.value)) & setAspectRatio('custom');

    const handleConfirm = () => {
        setIsSelected(false);
        setTimeout(() => {
            // ... (confirm logic is unchanged)
            const stage = stageRef.current;
            const imageNode = imageRef.current;
            if (!stage || !imageNode) return;

            const currentState = {
                x: imageNode.x(), y: imageNode.y(),
                scaleX: imageNode.scaleX(), scaleY: imageNode.scaleY(),
                rotation: imageNode.rotation(),
                aspectRatio, inputWidth, inputHeight,
            };
            
            const scaleFactor = inputWidth / displayDimensions.width;
            const cropArea = {
                x: (stageSize.width - displayDimensions.width) / 2,
                y: (stageSize.height - displayDimensions.height) / 2,
                width: displayDimensions.width, height: displayDimensions.height,
            };

            stage.toBlob({ ...cropArea, pixelRatio: scaleFactor, mimeType: 'image/png' })
                .then(blob => onConfirm({ blob, state: currentState }));
        }, 100);
    };
    
    const overlayPosition = {
        top: (stageSize.height - displayDimensions.height) / 2,
        left: (stageSize.width - displayDimensions.width) / 2,
    };

    return (
        <div className={styles.editorContainer}>
            <div ref={containerRef} className={styles.canvasWrapper}>
                <Stage
                    ref={stageRef} width={stageSize.width} height={stageSize.height}
                    onMouseDown={handleStageInteraction} onTouchStart={handleStageInteraction}
                >
                    <Layer>
                        {image && (
                            <Image
                                ref={imageRef} image={image} draggable
                                onClick={() => setIsSelected(true)} onTap={() => setIsSelected(true)}
                                onTransformEnd={() => {
                                    const node = imageRef.current;
                                    node.scaleX(node.scaleX());
                                    node.scaleY(node.scaleY());
                                }}
                                // **NEW**: Added touch event handlers
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            />
                        )}
                        {isSelected && (
                             <Transformer 
                                ref={transformerRef} rotateEnabled={true} keepRatio={true}
                                anchorStroke="var(--accent-color)" anchorFill="white" anchorSize={12}
                                borderStroke="var(--accent-color)" borderStrokeWidth={2} rotateAnchorOffset={25}
                             />
                        )}
                    </Layer>
                </Stage>
                <div
                    className={styles.canvasOverlay}
                    style={{
                        top: `${overlayPosition.top}px`, left: `${overlayPosition.left}px`,
                        width: `${displayDimensions.width}px`, height: `${displayDimensions.height}px`,
                    }}
                />
                <div className={styles.zoomControls}>
                    <button onClick={() => handleManualZoom('in')}>+</button>
                    <button onClick={() => handleManualZoom('out')}>-</button>
                </div>
            </div>

            <div className={styles.controlsFooter}>
                <div className={styles.aspectRatioControls}>
                    {Object.entries(CANVAS_CONFIG).map(([key, { name }]) => (
                        <button key={key}
                            className={`${styles.aspectRatioButton} ${aspectRatio === key ? styles.active : ''}`}
                            onClick={() => handlePresetClick(key)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div className={styles.customSizeInputs}>
                     <input type="number" value={inputWidth} onChange={handleWidthChange} className={styles.sizeInput} aria-label="Canvas Width" />
                     <span>x</span>
                     <input type="number" value={inputHeight} onChange={handleHeightChange} className={styles.sizeInput} aria-label="Canvas Height" />
                </div>
                <div className={styles.actionButtons}>
                    <button type="button" className={styles.cancelButton} onClick={onBack}>Cancel</button>
                    <button type="button" className={styles.confirmButton} onClick={handleConfirm}>Confirm & Save</button>
                </div>
            </div>
        </div>
    );
}
