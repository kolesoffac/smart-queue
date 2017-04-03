import eslint from 'rollup-plugin-eslint';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-js';
import progress from 'rollup-plugin-progress';
import inject from 'rollup-plugin-inject';
import json from 'rollup-plugin-json';
import path from 'path';
import babel from 'rollup-plugin-babel';
import cleanup from 'rollup-plugin-cleanup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import css from 'rollup-plugin-css-only'

export default {
	entry: 'src/main.js',
	dest: 'build/' + (process.env.BUILD_MODE === 'production'?'smart-queue.min.js':'smart-queue.js'),
	format: 'umd',
	moduleName: 'SmartQueue',
	plugins: [
		//css({ output: 'build/sx-leaflet.css' }),
		// visualizer({
		// 	filename: './statistics.html'
		// }),
		// babel({
		// 	exclude: 'node_modules/**',
		// }),
		cleanup(),
		json({
			//include: 'node_modules/**',  // Default: undefined
			//exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],  // Default: undefined
			//preferConst: true, // Default: false
		}),
		resolve({
			jsnext: true,
			main: true,
			browser: true
		}),
		commonjs(),
		(process.env.BUILD_MODE === 'eslint' && eslint({
			exclude: [
				'src/styles/**',
			]
		})),
		replace({
			exclude: 'node_modules/**',
			ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
		}),
		(process.env.BUILD_MODE === 'production' && uglify({}, minify)),
		progress({
			//clearLine: false // default: true
		})
	]
};