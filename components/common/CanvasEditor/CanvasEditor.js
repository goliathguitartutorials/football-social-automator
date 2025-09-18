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

// Define the editor and canvas dimensions
const EDITOR_WIDTH = 500;
const EDITOR_HEIGHT = 500;
const CANVAS_CONFIG = {
    '1:1': { width: 400, height: 400 },
    '4:5': { width: 400, height: 500 },
};
const ZOOM_STEP = 1.1;

export default function CanvasEditor({ imagePreview, onBack, onConfirm }) {
    const [image, setImage] = useState(null);
    const [isSelected, setIsSelected] = useState(false);
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

    // Effect to load the image and center it initially
    useEffect(() => {
        if (imagePreview) {
            const imageObj = new window.Image();
            imageObj.src = imagePreview;
            imageObj.onload = () => {
                setImage(imageObj);
                const stage = stageRef.current;
                const canvas = CANVAS_CONFIG[aspectRatio];

                // Calculate initial scale to fit the image within the canvas
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
                stage.batchDraw();
            };
        }
    }, [imagePreview, aspectRatio]);

    // Handle deselecting when clicking the stage background
    const handleStageMouseDown = (e) => {
        if (e.target === e.target.getStage()) {
            setIsSelected(false);
        }
    };

    // Handle manual zoom with +/- buttons
    const handleManualZoom = (direction) => {
        const imageNode = imageRef.current;
        const oldScale = imageNode.scaleX();
        const newScale = direction === 'in' ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP;

        imageNode.scaleX(newScale);
        imageNode.scaleY(newScale);
        imageNode.getLayer().batchDraw();
    };

    // Handle the final confirmation and image export
    const handleConfirm = () => {
        setIsSelected(false); // Hide transformer before exporting

        // Short delay to allow the UI to update
        setTimeout(() => {
            const canvas = CANVAS_CONFIG[aspectRatio];
            const stage = stageRef.current;
            const cropArea = {
                x: (stage.width() - canvas.width) / 2,
                y: (stage.height() - canvas.height) / 2,
                width: canvas.width,
                height: canvas.height,
            };

            stage.toBlob({
                ...cropArea,
                callback: (blob) => {
                    // This callback passes the final image back to the main form
                    if (onConfirm) {
                        onConfirm(blob);
                    }
                },
            });
        }, 100);
    };

    // Calculate dimensions for the visual overlay
    const canvas = CANVAS_CONFIG[aspectRatio];
    const overlayPosition = {
        top: (EDITOR_HEIGHT - canvas.height) / 2,
        left: (EDITOR_WIDTH - canvas.width) / 2,
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.header}>
                <h2>Adjust Canvas</h2>
                <p>Click the image to resize with handles, or use the buttons to zoom.</p>
            </div>

            <div className={styles.aspectRatioControls}>
                <button
                    className={`${styles.aspectRatioButton} ${aspectRatio === '1:1' ? styles.active : ''}`}
                    onClick={() => setAspectRatio('1:1')}
                >
                    Square (1:1)
                </button>
                <button
                    className={`${styles.aspectRatioButton} ${aspectRatio === '4:5' ? styles.active : ''}`}
                    onClick={() => setAspectRatio('4:5')}
                >
                    Portrait (4:5)
                </button>
            </div>
            
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
                        <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 50 || newBox.height < 50) return oldBox;
                                return newBox;
                            }}
                        />
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

            <div className={styles.controls}>
                <button type="button" className={styles.confirmButton} onClick={handleConfirm}>
                    Confirm & Save
                </button>
                <button type="button" className={styles.cancelButton} onClick={onBack}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
