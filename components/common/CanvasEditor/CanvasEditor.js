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

const EDITOR_WIDTH = 700;
const EDITOR_HEIGHT = 700;
const MAX_ONSCREEN_DIM = 650;

const CANVAS_CONFIG = {
    '1:1': { name: 'Square', width: 450, height: 450 },
    '4:5': { name: 'Portrait', width: 400, height: 500 },
    '9:16': { name: 'Story', width: 337, height: 600 },
    '16:9': { name: 'Landscape', width: 600, height: 338 },
};

const EXPORT_CONFIG = {
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
};

const ZOOM_STEP = 1.1;

export default function CanvasEditor({ imagePreview, onBack, onConfirm, initialState = null }) {
    const [image, setImage] = useState(null);
    const [isSelected, setIsSelected] = useState(false);
    
    // **MODIFIED**: State now initializes from `initialState` if it exists.
    const [aspectRatio, setAspectRatio] = useState(initialState?.aspectRatio || '1:1');
    const [inputWidth, setInputWidth] = useState(initialState?.inputWidth || EXPORT_CONFIG['1:1'].width);
    const [inputHeight, setInputHeight] = useState(initialState?.inputHeight || EXPORT_CONFIG['1:1'].height);

    const imageRef = useRef(null);
    const transformerRef = useRef(null);
    const stageRef = useRef(null);
    const isStateApplied = useRef(false); // Prevents re-applying initial state

    const displayDimensions = useMemo(() => {
        // ... (this logic is unchanged)
        if (aspectRatio !== 'custom' && CANVAS_CONFIG[aspectRatio]) {
            return CANVAS_CONFIG[aspectRatio];
        }
        if (!inputWidth || !inputHeight) {
            return { width: MAX_ONSCREEN_DIM, height: MAX_ONSCREEN_DIM };
        }
        const ratio = inputWidth / inputHeight;
        let scaledWidth = MAX_ONSCREEN_DIM;
        let scaledHeight = scaledWidth / ratio;
        if (scaledHeight > MAX_ONSCREEN_DIM) {
            scaledHeight = MAX_ONSCREEN_DIM;
            scaledWidth = scaledHeight * ratio;
        }
        return { width: scaledWidth, height: scaledHeight };
    }, [aspectRatio, inputWidth, inputHeight]);
    
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

    // **MODIFIED**: This effect now applies the `initialState` if provided.
    useEffect(() => {
        if (!image || !imageRef.current || !stageRef.current) return;

        // If we have a saved state and haven't applied it yet, apply it now.
        if (initialState && !isStateApplied.current) {
            imageRef.current.setAttrs({
                x: initialState.x,
                y: initialState.y,
                scaleX: initialState.scaleX,
                scaleY: initialState.scaleY,
                width: image.width,
                height: image.height,
            });
            isStateApplied.current = true; // Mark as applied
        } 
        // Otherwise, if it's the first time, run the default centering logic.
        else if (!isStateApplied.current) {
            const stage = stageRef.current;
            const canvas = displayDimensions;
            const scale = Math.min(canvas.width / image.width, canvas.height / image.height, 1);
            imageRef.current.setAttrs({
                x: (stage.width() - image.width * scale) / 2,
                y: (stage.height() - image.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                width: image.width,
                height: image.height,
            });
        }

        setIsSelected(true);
    }, [image, displayDimensions, initialState]);

    const handleStageMouseDown = (e) => {
        if (e.target === e.target.getStage()) setIsSelected(false);
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

    const handleWidthChange = (e) => {
        setInputWidth(Number(e.target.value));
        setAspectRatio('custom');
    };
    const handleHeightChange = (e) => {
        setInputHeight(Number(e.target.value));
        setAspectRatio('custom');
    };

    // **MODIFIED**: onConfirm now returns an object with the blob AND the editor's state.
    const handleConfirm = () => {
        setIsSelected(false);
        setTimeout(() => {
            const stage = stageRef.current;
            const imageNode = imageRef.current;
            if (!stage || !imageNode) return;

            // Capture the current state of the image and canvas
            const currentState = {
                x: imageNode.x(),
                y: imageNode.y(),
                scaleX: imageNode.scaleX(),
                scaleY: imageNode.scaleY(),
                aspectRatio,
                inputWidth,
                inputHeight,
            };
            
            const scaleFactor = inputWidth / displayDimensions.width;
            const cropArea = {
                x: (EDITOR_WIDTH - displayDimensions.width) / 2,
                y: (EDITOR_HEIGHT - displayDimensions.height) / 2,
                width: displayDimensions.width,
                height: displayDimensions.height,
            };

            stage.toBlob({ ...cropArea, pixelRatio: scaleFactor, mimeType: 'image/png' })
                .then(blob => onConfirm({ blob, state: currentState })); // Return both
        }, 100);
    };
    
    const overlayPosition = {
        top: (EDITOR_HEIGHT - displayDimensions.height) / 2,
        left: (EDITOR_WIDTH - displayDimensions.width) / 2,
    };

    return (
        <div className={styles.editorContainer}>
            {/* ... JSX for the editor is unchanged ... */}
            <div className={styles.canvasWrapper}>
                <Stage
                    ref={stageRef}
                    width={EDITOR_WIDTH}
                    height={EDITOR_HEIGHT}
                    onMouseDown={handleStageMouseDown}
                >
                    <Layer>
                        {image && (
                            <Image
                                ref={imageRef}
                                image={image}
                                draggable
                                onClick={() => setIsSelected(true)}
                                onTap={() => setIsSelected(true)}
                                onTransformEnd={() => {
                                    const node = imageRef.current;
                                    node.scaleX(node.scaleX());
                                    node.scaleY(node.scaleY());
                                }}
                            />
                        )}
                        {isSelected && <Transformer ref={transformerRef} />}
                    </Layer>
                </Stage>
                <div
                    className={styles.canvasOverlay}
                    style={{
                        top: `${overlayPosition.top}px`,
                        left: `${overlayPosition.left}px`,
                        width: `${displayDimensions.width}px`,
                        height: `${displayDimensions.height}px`,
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
                        <button
                            key={key}
                            className={`${styles.aspectRatioButton} ${aspectRatio === key ? styles.active : ''}`}
                            onClick={() => handlePresetClick(key)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div className={styles.customSizeInputs}>
                     <input 
                        type="number"
                        value={inputWidth}
                        onChange={handleWidthChange}
                        className={styles.sizeInput}
                        aria-label="Canvas Width"
                     />
                     <span>x</span>
                     <input 
                        type="number"
                        value={inputHeight}
                        onChange={handleHeightChange}
                        className={styles.sizeInput}
                        aria-label="Canvas Height"
                     />
                </div>
                <div className={styles.actionButtons}>
                    <button type="button" className={styles.cancelButton} onClick={onBack}>Cancel</button>
                    <button type="button" className={styles.confirmButton} onClick={handleConfirm}>Confirm & Save</button>
                </div>
            </div>
        </div>
    );
}
