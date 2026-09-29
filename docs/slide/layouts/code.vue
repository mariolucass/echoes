<template>
  <ConferenceFrame variant="code">
    <div class="conference-heading"><slot name="header" /></div>
    <div class="conference-code-columns">
      <div><slot /></div>
      <div class="conference-code-caption"><slot name="right" /></div>
    </div>
  </ConferenceFrame>
</template>
