import "./Card.css"
import { motion } from "framer-motion"
import { useDragControls } from "framer-motion";
import { useRef } from "react";

interface CardProps {
    url: string;
    x: number;
    y: number;
    tapped: boolean;
    onPositionChange: (x: number, y: number) => void;
    onTap: () => void;
}

function Card({ url, x, y, onPositionChange, tapped, onTap }: CardProps) {
    const controls = useDragControls();
    const cardRef = useRef<HTMLDivElement>(null);

    function handleDragEnd(_event: MouseEvent) {
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
            initial={{ x, y, rotate: tapped ? 90 : 0 }}
            animate={{ x, y, rotate: tapped ? 90 : 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            dragControls={controls}
            drag={true}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDragEnd={handleDragEnd}
            onDoubleClick={onTap}
        >
            <img src={url} draggable={false} alt="Card Image" />
        </motion.div>
    );
}

export default Card
