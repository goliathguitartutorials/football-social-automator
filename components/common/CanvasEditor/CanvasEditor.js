/*
 * ==========================================================
 * COMPONENT: CanvasEditor
 * PAGE: Create Post, Schedule Post
 * FILE: /components/common/CanvasEditor/CanvasEditor.js
 * ==========================================================
 */
'use client';
import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import styles from './CanvasEditor.module.css';

const ZOOM_STEP = 1.1; // How much to zoom in/out on each step

export default function CanvasEditor({ imagePreview, onBack }) {
    const [image, setImage] = useState(null);
    const stageRef = useRef(null);

    // NEW: State to manage the position and scale of the stage
    const [stage, setStage] = useState({
        scale: 1,
        x: 0,
        y: 0,
    });

    // Load the image from the preview URL into a format Konva can use
    useEffect(() => {
        if (imagePreview) {
            const imageObj = new window.Image();
            imageObj.src = imagePreview;
            imageObj.onload = () => {
                setImage(imageObj);

                // NEW: Center the image initially when it loads
                if (stageRef.current) {
                    const stageWidth = stageRef.current.width();
                    const stageHeight = stageRef.current.height();
                    setStage({
                        scale: 1,
                        x: (stageWidth - imageObj.width) / 2,
                        y: (stageHeight - imageObj.height) / 2,
                    });
                }
            };
        }
    }, [imagePreview]);

    // NEW: Handle zooming with the mouse wheel
    const handleWheel = (e) => {
        e.evt.preventDefault(); // Prevent page scrolling

        const scaleBy = ZOOM_STEP;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        // Determine new scale based on scroll direction
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        setStage({
            scale: newScale,
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };
    
    // NEW: Handle manual zoom controls (+/- buttons)
    const handleManualZoom = (direction) => {
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const center = {
            x: stage.width() / 2,
            y: stage.height() / 2,
        };

        const mousePointTo = {
            x: (center.x - stage.x()) / oldScale,
            y: (center.y - stage.y()) / oldScale,
        };

        const newScale = direction === 'in' ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP;

        setStage({
            scale: newScale,
            x: center.x - mousePointTo.x * newScale,
            y: center.y - mousePointTo.y * newScale,
        });
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.header}>
                <h2>Adjust Canvas</h2>
                <p>Use the mouse wheel to zoom and drag to pan the image.</p>
            </div>
            
            <div className={styles.canvasWrapper}>
                {image ? (
                    <Stage
                        width={500}
                        height={500}
                        onWheel={handleWheel}
                        draggable // NEW: Make the stage pannable
                        scaleX={stage.scale}
                        scaleY={stage.scale}
                        x={stage.x}
                        y={stage.y}
                        ref={stageRef}
                    >
                        <Layer>
                            <Image image={image} />
                        </Layer>
                    </Stage>
                ) : (
                    <p>Loading image...</p>
                )}

                {/* NEW: On-screen zoom controls */}
                <div className={styles.zoomControls}>
                    <button onClick={() => handleManualZoom('in')}>+</button>
                    <button onClick={() => handleManualZoom('out')}>-</button>
                </div>
            </div>

            <div className={styles.controls}>
                <button type="button" className={styles.backButton} onClick={onBack}>
                    Back to Form
                </button>
            </div>
        </div>
    );
}
