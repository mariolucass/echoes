<template>
  <ConferenceFrame variant="two-cols">
    <div class="conference-heading"><slot name="header" /></div>
    <div class="conference-columns">
      <div><slot /></div>
      <div><slot name="right" /></div>
    </div>
  </ConferenceFrame>
</template>
