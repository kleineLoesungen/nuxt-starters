<template>
	<div
		v-if="visible"
		:class="[
			'flex items-center justify-between px-4 py-3 rounded-lg shadow-md transition-opacity duration-300',
			type === 'success'
				? 'bg-green-100 text-green-800 border border-green-300'
				: 'bg-red-100 text-red-800 border border-red-300',
		]"
		role="alert"
	>
		<span class="text-sm font-medium">{{ props.message }}</span>
		<button
			class="ml-4 text-sm hover:underline focus:outline-none"
			@click="close"
		>
			Schließen
		</button>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps<{
	message: string;
	type?: 'success' | 'error';
}>();

const emit = defineEmits(['close']);

const visible = ref(true);

// ⏱ Auto-close nach 4 Sekunden
onMounted(() => {
	setTimeout(() => {
		close();
	}, 4000);
});

function close() {
	visible.value = false;
	emit('close');
}
</script>
