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
    '1:1': { width: 450, height: 450 },
    '4:5': { width: 400, height: 500 },
    '9:16': { width: 337, height: 600 },
    '16:9': { width: 600, height: 338 },
};
const ZOOM_STEP = 1.1;

export default function CanvasEditor({ imagePreview, onBack, onConfirm }) {
    const [image, setImage] = useState(null);
    const [isSelected, setIsSelected] = useState(true); // Select by default
    const [aspectRatio, setAspectRatio] = useState('1:1');

    const imageRef = useRef(null);
    const transformerRef = useRef(null);
    const stageRef = useRef(null);

    // Effect to attach/detach the resize transformer
    useEffect(() => {
        if (transformerRef.current) {
            if (isSelected) {
                transformerRef.current.nodes([imageRef.current]);
            } else {
                transformerRef.current.nodes([]);
            }
            transformerRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    // Effect to load and correctly scale/center the image
    useEffect(() => {
        if (imagePreview) {
            const imageObj = new window.Image();
            imageObj.src = imagePreview;
            imageObj.onload = () => {
                setImage(imageObj);
                const stage = stageRef.current;
                const canvas = CANVAS_CONFIG[aspectRatio];

                // FIXED: Calculate initial scale to fit image within canvas
                const scale = Math.min(canvas.width / imageObj.width, canvas.height / imageObj.height, 1);

                imageRef.current.setAttrs({
                    x: (stage.width() - imageObj.width * scale) / 2,
                    y: (stage.height() - imageObj.height * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    width: imageObj.width,
                    height: imageObj.height,
                });
                setIsSelected(true); // Keep it selected
                stage.batchDraw();
            };
        }
    }, [imagePreview, aspectRatio]);

    const handleStageMouseDown = (e) => {
        if (e.target === e.target.getStage()) setIsSelected(false);
    };

    const handleManualZoom = (direction) => {
        const imageNode = imageRef.current;
        const oldScale = imageNode.scaleX();
        const newScale = direction === 'in' ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP;
        imageNode.scaleX(newScale);
        imageNode.scaleY(newScale);
    };

    const handleConfirm = () => {
        setIsSelected(false);
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
                            />
                        )}
                        <Transformer ref={transformerRef} />
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
                    {Object.keys(CANVAS_CONFIG).map(key => (
                        <button
                            key={key}
                            className={`${styles.aspectRatioButton} ${aspectRatio === key ? styles.active : ''}`}
                            onClick={() => setAspectRatio(key)}
                        >
                            {key === '1:1' && 'Square'}
                            {key === '4:5' && 'Portrait'}
                            {key === '9:16' && 'Story'}
                            {key === '16:9' && 'Landscape'}
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
