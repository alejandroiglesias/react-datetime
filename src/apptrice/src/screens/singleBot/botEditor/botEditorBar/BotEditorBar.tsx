import * as React from 'react'
import { BacktestConfig } from '../../../botEditor/tools/BotTools';
import Button from '../../../botEditor/tools/Button';
import ProgressBar from '../../../botEditor/tools/ProgressBar';
import styles from './BotEditorBar.module.css';
import BotEditorConsolePanel from './console/BotEditorConsolePanel';
import BotEditorConsoleTab from './console/BotEditorConsoleTab';
import ProblemsPanel from './problems/ProblemsPanel';
import ProblemsTab from './problems/ProblemsTab';

interface CodeProblem {
	startLineNumber: number,
	startColumn: number,
	message: string,
	severity: number
}
interface BotEditorBarProps {
	codeProblems: CodeProblem[],
	currentBackTesting?: any,
	onRun: (config: BacktestConfig) => void,
	onAbort: () => void
}

const tabComponents: {[any:string]: any} = {
	problems: ProblemsTab,
	console: BotEditorConsoleTab
};

const panelComponents: { [any: string]: any } = {
	problems: ProblemsPanel,
	console: BotEditorConsolePanel
}

export default class BotEditorBar extends React.Component<BotEditorBarProps> {
	state = {
		currentTab: 'problems'
	}

	render() {
		return (
			<div className={styles.container}>
				<div className={styles.tabsBar}>
					<div className={styles.tabs}>
						{this.renderTabs()}
					</div>
					<div className={styles.buttons}>
						{this.renderBt()}
					</div>
				</div>
				<div className={styles.panelBar}>
					{ this.renderPanel() }
				</div>
			</div>
		)
	}

	renderTabs(){
		return Object.keys( tabComponents ).map( key => {
			let Tab: any = tabComponents[key];
			return (
				<Tab key={key}
					isActive={ key === this.state.currentTab }
					onPress={ this._onTabPress }
					problems={this.props.codeProblems }
					backtesting={ this.props.currentBackTesting } />
			);
		})
	}

	renderPanel(){
		let Panel: any = panelComponents[this.state.currentTab];
		return (
			<Panel
				problems={this.props.codeProblems}
				backtesting={this.props.currentBackTesting} />
		);
	}

	renderProblems() {
		let errors: CodeProblem[] = [];
		let warnings: CodeProblem[] = [];
		this.props.codeProblems.forEach( problem => {
			if( problem.severity > 5 ){
				errors.push( problem );
			}
			else if( problem.severity > 2 ){
				warnings.push( problem );
			}
		});

		return (
			<>
				{ this.renderErrors(errors) }
				{ this.renderWarnings(warnings) }
			</>
		);
	}

	renderErrors( errors: CodeProblem[] ){
		if( !errors.length ) return;
		return (
			<div className={styles.errorCount}>
				<i className={`fas fa-exclamation-triangle ${styles.error}`}></i>
				<span> {errors.length}</span>
			</div>
		);
	}

	renderWarnings(warnings: CodeProblem[]) {
		if (!warnings.length) return;
		return (
			<div className={styles.warningCount}>
				<i className={`fas fa-exclamation-triangle ${styles.warning}`}></i>
				<span> {warnings.length}</span>
			</div>
		);
	}

	renderBt() {
		return (
			<div>
				<div>
					{this.renderButton()}
				</div>
				<div>
					{this.renderProgress()}
				</div>
			</div>
		)
	}


	renderButton() {
		if (this.isBtRunning()) {
			return (
				<Button onClick={this._onAbortBT}>
					Abort
				</Button>
			);
		}
		return (
			<Button onClick={this._onStartPressed}>
				Start backtesting
			</Button>
		)
	}

	renderProgress() {
		if (!this.isBtRunning()) return;

		const { currentBackTesting } = this.props;
		const progress = currentBackTesting.iteration / currentBackTesting.totalIterations * 100;
		return (
			<ProgressBar progress={progress} />
		);
	}


	updatePercentage(field: string, value: string) {
		if (value[value.length - 1] !== '%') {
			this.setState({ [field]: value + '%' });
		}
		else {
			this.setState({ [field]: value });
		}
	}


	isBtRunning(): boolean {
		return this.props.currentBackTesting?.status === 'running' || false;
	}

	_onStartPressed = () => {
		let errors = this.getValidationErrors();
		if (errors) {
			this.setState({ errors });
		}

		this.props.onRun(this.getDefaultConfig());
	}

	_onAbortBT = () => {
		this.props.onAbort();
	}

	getValidationErrors() {
		return false;
	}


	getDefaultConfig(): BacktestConfig {
		const DAY = 24 * 60 * 60 * 1000;
		let startDate = this.getInputDate(Date.now() - 8 * DAY);
		let endDate = this.getInputDate(Date.now() - DAY);

		let start = new Date(startDate + 'T00:00:00.000Z');
		let end = new Date(endDate + 'T23:59:59.999Z');

		return {
			baseAssets: ['ETH', 'BTC'],
			quotedAsset: 'USD',
			interval: '1h',
			initialBalances: {
				USD: 1000
			}, 
			startDate: start.getTime(),
			endDate: end.getTime(),
			fees: 0.1,
			slippage: 0.2
		};
	}

	getInputDate(time: number) {
		let date = new Date(time);
		return date.toISOString().split('T')[0];
	}

	_onTabPress( currentTab:string ){
		this.setState({currentTab});
	}
}
