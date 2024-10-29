<script lang="ts">
    let isNightMode = false;
</script>

<label id="daynighttoggle">
    <input
        type="checkbox"
        bind:checked={isNightMode}
        on:click={() => (isNightMode = !isNightMode)}
        aria-label="Toggle Day/Night Mode"
    />
    <div class="toggle">
        <!-- Using Unicode characters for simplicity. Replace with SVGs if more control is needed. -->
        <span class="icon">{isNightMode ? '🌜' : '🌞'}</span>
        <div class="toggle-knob" class:night-mode={isNightMode}></div>
    </div>
</label>

<style>
    #daynighttoggle {
        display: inline-block;
        position: relative;
        width: 50px;
        height: 25px;
        cursor: pointer;
    }

    input[type='checkbox'] {
        opacity: 0;
        position: absolute;
        width: 100%;
        height: 100%;
        cursor: pointer;
    }

    .toggle {
        display: block;
        width: 50px;
        height: 25px;
        background-color: var(--palette-1-day); /* Reverted to original color */
        border-radius: 15px;
        transition: background-color 400ms ease;
    }

    .icon {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }

    .toggle-knob {
        display: block;
        width: 23px;
        height: 23px;
        background-color: var(--palette-3-day); /* Reverted to original color */
        border-radius: 50%;
        transition: transform 400ms ease;
        position: absolute;
        top: 1px;
        left: 1px;
    }

    .night-mode {
        transform: translateX(25px);
        background-color: var(--palette-3-night); /* Optional: Change knob color in night mode */
    }
</style>