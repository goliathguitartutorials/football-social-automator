/*
 * ==========================================================
 * COMPONENT: CanvasEditor
 * PAGE: Create Post, Schedule Post
 * FILE: /components/common/CanvasEditor/CanvasEditor.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import styles from './CanvasEditor.module.css';

export default function CanvasEditor({ imagePreview, onBack }) {
    const [image, setImage] = useState(null);

    // This effect loads the image from the preview URL into a format
    // that Konva can use on the canvas.
    useEffect(() => {
        if (imagePreview) {
            const imageObj = new window.Image();
            imageObj.src = imagePreview;
            imageObj.onload = () => {
                setImage(imageObj);
            };
        }
    }, [imagePreview]);

    return (
        <div className={styles.editorContainer}>
            <div className={styles.header}>
                <h2>Adjust Canvas</h2>
                <p>Pan and zoom your image to fit the canvas. (Controls coming soon!)</p>
            </div>
            
            <div className={styles.canvasWrapper}>
                {image ? (
                    <Stage width={500} height={500}>
                        <Layer>
                            <Image image={image} />
                        </Layer>
                    </Stage>
                ) : (
                    <p>Loading image...</p>
                )}
            </div>

            <div className={styles.controls}>
                 {/* This button uses a pre-existing style from the other component */}
                <button type="button" className="actionButton_Secondary" onClick={onBack}>
                    Back to Form
                </button>
            </div>
        </div>
    );
}
