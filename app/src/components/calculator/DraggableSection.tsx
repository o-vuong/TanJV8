import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

interface DraggableSectionProps {
	id: string;
	children: ReactNode;
}

function SortableSection({ id, children }: DraggableSectionProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} className="relative group pl-8">
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="absolute left-0 top-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-700/50 rounded z-10"
				aria-label="Drag to reorder"
			>
				<GripVertical className="w-5 h-5 text-slate-400" />
			</button>
			{children}
		</div>
	);
}

interface DraggableSectionsProps {
	sectionIds: string[];
	onReorder: (newOrder: string[]) => void;
	children: ReactNode;
}

export function DraggableSections({
	sectionIds,
	onReorder,
	children,
}: DraggableSectionsProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = sectionIds.indexOf(String(active.id));
			const newIndex = sectionIds.indexOf(String(over.id));

			const newOrder = arrayMove(sectionIds, oldIndex, newIndex);
			onReorder(newOrder);
		}
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={sectionIds}
				strategy={verticalListSortingStrategy}
			>
				{children}
			</SortableContext>
		</DndContext>
	);
}

export { SortableSection };

