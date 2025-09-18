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

// All required canvas sizes from the feature plan
const CANVAS_CONFIG = {
    '1:1': { name: 'Square', width: 450, height: 450 },
    '4:5': { name: 'Portrait', width: 400, height: 500 },
    '9:16': { name: 'Story', width: 337, height: 600 },
    '16:9': { name: 'Landscape', width: 600, height: 338 },
};
const ZOOM_STEP = 1.1;

export default function CanvasEditor({ imagePreview, onBack, onConfirm }) {
    const [image, setImage] = useState(null);
    const [isSelected, setIsSelected] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('1:1');

    const imageRef = useRef(null);
    const transformerRef = useRef(null);
    const stageRef = useRef(null);

    // CRITICAL FIX: This effect now safely attaches the transformer.
    // It waits until the image is loaded AND selected before acting.
    useEffect(() => {
        if (isSelected && imageRef.current && transformerRef.current) {
            transformerRef.current.nodes([imageRef.current]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [isSelected, image]); // Depends on both image and selection state

    // Effect to load and correctly scale/center the image
    useEffect(() => {
        if (imagePreview) {
            const imageObj = new window.Image();
            imageObj.src = imagePreview;
            imageObj.onload = () => {
                setImage(imageObj); // Set the image state
                const stage = stageRef.current;
                const canvas = CANVAS_CONFIG[aspectRatio];

                if (!stage || !imageRef.current) return;

                // FIXED: Calculate initial scale to perfectly fit image within canvas
                const scale = Math.min(canvas.width / imageObj.width, canvas.height / imageObj.height, 1);

                imageRef.current.setAttrs({
                    x: (stage.width() - imageObj.width * scale) / 2,
                    y: (stage.height() - imageObj.height * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    width: imageObj.width,
                    height: imageObj.height,
                });
                
                setIsSelected(true); // Select image by default
            };
        }
    }, [imagePreview, aspectRatio]);

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

    const handleConfirm = () => {
        setIsSelected(false); // Hide transformer before exporting
        setTimeout(() => {
            const canvas = CANVAS_CONFIG[aspectRatio];
            const stage = stageRef.current;
            const cropArea = {
                x: (stage.width() - canvas.width) / 2,
                y: (stage.height() - canvas.height) / 2,
                width: canvas.width,
                height: canvas.height,
            };
            stage.toBlob({ ...cropArea, mimeType: 'image/png' })
                 .then(blob => onConfirm(blob));
        }, 100);
    };

    const canvas = CANVAS_CONFIG[aspectRatio];
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
                                onDragEnd={(e) => {
                                    // Manually update position on drag end if needed for state
                                }}
                                onTransformEnd={(e) => {
                                    const node = imageRef.current;
                                    const scaleX = node.scaleX();
                                    const scaleY = node.scaleY();
                                    node.scaleX(scaleX);
                                    node.scaleY(scaleY);
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
                            onClick={() => setAspectRatio(key)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div className={styles.actionButtons}>
                    <button type="button" className={styles.cancelButton} onClick={onBack}>Cancel</button>
                    <button type="button" className={styles.confirmButton} onClick={handleConfirm}>Confirm & Save</button>
                </div>
            </div>
        </div>
    );
}
