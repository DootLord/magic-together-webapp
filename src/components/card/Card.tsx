import "./Card.css"
import { motion, PanInfo } from "framer-motion"
import { useDragControls } from "framer-motion";
import { useRef, useEffect } from "react";

interface CardProps {
    url: string;
    x: number;
    y: number;
    onPositionChange: (x: number, y: number) => void;
}

function Card({ url, x, y, onPositionChange }: CardProps) {
    const controls = useDragControls();
    const cardRef = useRef<HTMLDivElement>(null);

    function handleDragEnd(_event: MouseEvent, info: PanInfo) {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const x = rect.left;
            const y = rect.top;
            onPositionChange(x, y);

        }
    }

    function handleMouseDown() {
    }

    function handleMouseUp() {
    }

    return (
        <motion.div
            ref={cardRef}
            className='card-container'
            initial={{ x, y }}
            animate={{ x, y }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            dragControls={controls}
            drag={true}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDragEnd={handleDragEnd}
        >
            <img src={url} alt="Card Image" />
        </motion.div>
    );
}

export default Card
