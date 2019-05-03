<template>
    <button @click="onClick">
        <slot></slot>
    </button>
</template>

<script>
  export default {
    props: {
      model: {
        type: Object,
        default: null,
        validator(x) {
          return x != null
        }
      },
    },
    created() {
      console.log('CREATED BpmDiagram!')
    },
    methods: {
      onClick(event) {
        this.$emit("click", event);
      },

      onDoubleClick(event) {
        this.$emit("dblclick", event);
      },
    }
  }
</script>

<style>
</style>