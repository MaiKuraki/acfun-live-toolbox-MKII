<template>
	<content-frame align="row" id="applets">
		<div class="appletList">
			<div style="display: flex; justify-content: space-between">
				<div class="hint">为工具箱提供各种增强功能,不定时上新</div>
				<div class="hint">旧版小程序在未来版本将废弃</div>
				<div>
					<el-button type="primary" @click="refreshList"
						>刷新列表</el-button
					>
					<el-button type="primary" @click="openFolder"
						>打开存放文件夹</el-button
					>
					<el-button type="primary" @click="openDocument"
						>二次开发点我</el-button
					>
				</div>
			</div>
			<div
				v-for="(applet, index) in applets"
				class="appletRow"
				:key="index"
			>
				<div class="block" :title="applet.name">
					<div :class="applet.icon" />
				</div>
				<div class="desc">
					<div class="title">{{ applet.name }}</div>
					<div class="detail" :title="applet.description">
						{{ applet.description || "暂无描述" }}
					</div>
					<div class="tags">
						<el-tag
							v-for="(tag, index) in applet.tags || []"
							:key="index"
							>{{ tag }}</el-tag
						>
					</div>
				</div>
				<el-button
					class="start"
					type="primary"
					@click="startApplet(applet)"
					:disabled="
						applet.configurations.liveOnly &&
						$store.state.streamStatus.step !== 'danmakuing'
					"
					>启动
				</el-button>
			</div>
		</div>
	</content-frame>
</template>

<script lang="ts">
import mixin from "./mixin";
export default mixin;
</script>

<style scoped lang="scss">
@use "sass:map";
@import "@front/styles/common.scss";
@import "@front/styles/scrollbar.scss";

#applets {
	display: flex;
	flex-direction: column;
}
.appletList {
	position: absolute;
	width: 100%;
	height: calc(100%);
	box-sizing: border-box;
	@include scrollbarDark();
}
.appletRow {
	width: calc(100% - 8px);
	min-height: 80px;
	box-shadow: getCssVar("box-shadow", "base");
	box-sizing: border-box;
	padding: 4px;
	margin: 8px 4px;
	display: flex;
	&:hover {
		color: $--color-primary;
		box-shadow: getCssVar("box-shadow", "light");
	}
}
.block {
	height: 60px;
	width: 60px;
	border-radius: 4px;
	margin: 5px;
	display: flex;
	font-size: getCssVar("font-size-large");
	align-items: center;
	justify-content: center;
	border: getCssVar("border", "base");
	color: getCssVar("text-color", "secondary");
	flex-shrink: 0;
}
.desc {
	position: relative;
	width: calc(100% - 122px);
	padding: 4px;
	.title {
		color: getCssVar("text-color", "primary");
	}
	.detail {
		color: getCssVar("text-color", "secondary");
		width: 100%;
		word-break: break-all;
		text-overflow: ellipsis;
		margin-bottom: 4px;
	}
}
.start {
	margin: 5px;
	height: 60px;
	flex-shrink: 0;
	width: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
}
.tags {
	& > * {
		margin-right: 8px;
	}
}
</style>
