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

export default function CanvasEditor({ imagePreview, onBack }) {
    const [image, setImage] = useState(null);
    const [isSelected, setIsSelected] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('1:1');

    const imageRef = useRef(null);
    const transformerRef = useRef(null);
    const stageRef = useRef(null);

    // Effect to attach/detach the resize transformer to the image
    useEffect(() => {
        if (isSelected) {
            transformerRef.current.nodes([imageRef.current]);
            transformerRef.current.getLayer().batchDraw();
        } else {
            transformerRef.current.nodes([]);
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
                // Center the image
                const canvas = CANVAS_CONFIG[aspectRatio];
                imageRef.current.x((canvas.width - imageObj.width / 2) / 2);
                imageRef.current.y((canvas.height - imageObj.height / 2) / 2);
            };
        }
    }, [imagePreview, aspectRatio]);
    
    // Check if the click was on the stage (background) to deselect the image
    const handleStageMouseDown = (e) => {
        if (e.target === e.target.getStage()) {
            setIsSelected(false);
        }
    };

    // Calculate the dimensions and position for the visual overlay
    const canvas = CANVAS_CONFIG[aspectRatio];
    const overlayPosition = {
        top: (EDITOR_HEIGHT - canvas.height) / 2,
        left: (EDITOR_WIDTH - canvas.width) / 2,
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.header}>
                <h2>Adjust Canvas</h2>
                <p>Click the image to resize and drag to position it.</p>
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
                                // Limit resize dimensions
                                if (newBox.width < 50 || newBox.height < 50) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                        />
                    </Layer>
                </Stage>
                {/* This overlay creates the dimmed effect outside the canvas */}
                <div
                    className={styles.canvasOverlay}
                    style={{
                        top: `${overlayPosition.top}px`,
                        left: `${overlayPosition.left}px`,
                        width: `${canvas.width}px`,
                        height: `${canvas.height}px`,
                    }}
                />
            </div>

            <div className={styles.controls}>
                <button type="button" className={styles.backButton}>
                    Confirm & Save
                </button>
                <button type="button" className={styles.backButton} onClick={onBack}>
                    Back
                </button>
            </div>
        </div>
    );
}
