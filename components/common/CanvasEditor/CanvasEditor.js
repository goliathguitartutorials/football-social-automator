/*
 * ==========================================================
 * COMPONENT: CanvasEditor
 * PAGE: Create Post, Schedule Post
 * FILE: /components/common/CanvasEditor/CanvasEditor.js
 * ==========================================================
 */
'use client';
import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Transformer } from 'react-konva';
import styles from './CanvasEditor.module.css';

// A larger editor area for more "breathing room"
const EDITOR_WIDTH = 700;
const EDITOR_HEIGHT = 700;

// All required ON-SCREEN canvas sizes for the editor UI
const CANVAS_CONFIG = {
    '1:1': { name: 'Square', width: 450, height: 450 },
    '4:5': { name: 'Portrait', width: 400, height: 500 },
    '9:16': { name: 'Story', width: 337, height: 600 },
    '16:9': { name: 'Landscape', width: 600, height: 338 },
};

// Defines the FINAL EXPORT resolution for each canvas.
const EXPORT_CONFIG = {
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
};

const ZOOM_STEP = 1.1;

export default function CanvasEditor({ imagePreview, onBack, onConfirm }) {
    const [image, setImage] = useState(null);
    const [isSelected, setIsSelected] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('1:1');

    // **NEW**: State to manage the width and height inputs
    const [inputWidth, setInputWidth] = useState(EXPORT_CONFIG['1:1'].width);
    const [inputHeight, setInputHeight] = useState(EXPORT_CONFIG['1:1'].height);

    const imageRef = useRef(null);
    const transformerRef = useRef(null);
    const stageRef = useRef(null);

    // This effect safely attaches the transformer.
    useEffect(() => {
        if (isSelected && imageRef.current && transformerRef.current) {
            transformerRef.current.nodes([imageRef.current]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [isSelected, image]);

    // **MODIFIED**: Effect #1 - This now ONLY loads the image from the preview URL.
    useEffect(() => {
        if (imagePreview) {
            const imageObj = new window.Image();
            imageObj.src = imagePreview;
            imageObj.onload = () => {
                setImage(imageObj); // Set the image state, which triggers the next effect
            };
        }
    }, [imagePreview]);

    // **MODIFIED**: Effect #2 - This now handles ALL scaling and positioning.
    // It runs after the image is loaded OR when the aspect ratio changes, fixing the initial sizing bug.
    useEffect(() => {
        if (!image || !imageRef.current || !stageRef.current) return;

        const stage = stageRef.current;
        const canvas = CANVAS_CONFIG[aspectRatio] || { width: 450, height: 450 }; // Fallback for custom

        // Calculate initial scale to perfectly fit image within canvas
        const scale = Math.min(canvas.width / image.width, canvas.height / image.height, 1);

        imageRef.current.setAttrs({
            x: (stage.width() - image.width * scale) / 2,
            y: (stage.height() - image.height * scale) / 2,
            scaleX: scale,
            scaleY: scale,
            width: image.width,
            height: image.height,
        });

        setIsSelected(true); // Select image by default
    }, [image, aspectRatio]);


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
    
    // **NEW**: Handler for when a preset button is clicked
    const handlePresetClick = (key) => {
        setAspectRatio(key);
        setInputWidth(EXPORT_CONFIG[key].width);
        setInputHeight(EXPORT_CONFIG[key].height);
    };

    // **NEW**: Handlers for the manual input fields
    const handleWidthChange = (e) => {
        setInputWidth(Number(e.target.value));
        setAspectRatio('custom'); // De-select presets
    };
    const handleHeightChange = (e) => {
        setInputHeight(Number(e.target.value));
        setAspectRatio('custom'); // De-select presets
    };

    // MODIFIED: This function now handles both preset and custom exports.
    const handleConfirm = () => {
        setIsSelected(false);
        setTimeout(() => {
            const stage = stageRef.current;
            if (!stage) return;

            // Use the on-screen display canvas for positioning and scaling calculations
            const displayCanvas = CANVAS_CONFIG[aspectRatio] || CANVAS_CONFIG['1:1'];
            
            let scaleFactor = 1;

            // If a preset is active, calculate the high-res scale factor
            if (aspectRatio !== 'custom' && EXPORT_CONFIG[aspectRatio]) {
                 scaleFactor = EXPORT_CONFIG[aspectRatio].width / displayCanvas.width;
            } else {
                // For custom sizes, we need to find a suitable on-screen box to export from.
                // We'll scale the user's custom dimensions down to fit our editor.
                const ratio = inputWidth / inputHeight;
                let displayWidth = displayCanvas.width;
                let displayHeight = displayWidth / ratio;

                if (displayHeight > displayCanvas.height) {
                    displayHeight = displayCanvas.height;
                    displayWidth = displayHeight * ratio;
                }
                // The scale factor is the ratio of their desired size to our calculated display size
                scaleFactor = inputWidth / displayWidth;
            }

            const cropArea = {
                x: (stage.width() - displayCanvas.width) / 2,
                y: (stage.height() - displayCanvas.height) / 2,
                width: displayCanvas.width,
                height: displayCanvas.height,
            };

            stage.toBlob({
                ...cropArea,
                pixelRatio: scaleFactor,
                mimeType: 'image/png'
            })
            .then(blob => onConfirm(blob));
        }, 100);
    };

    // Use the on-screen config for the overlay, even for custom sizes
    const canvas = CANVAS_CONFIG[aspectRatio] || CANVAS_CONFIG['1:1'];
    const overlayPosition = {
        top: (EDITOR_HEIGHT - canvas.height) / 2,
        left: (EDITOR_WIDTH - canvas.width) / 2,
    };

    return (
        <div className={styles.editorContainer}>
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
                                onTransformEnd={(e) => {
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
                        width: `${canvas.width}px`,
                        height: `${canvas.height}px`,
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
                {/* **NEW**: Manual input fields for custom canvas size */}
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
